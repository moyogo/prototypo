import React from 'react';
import classNames from 'classnames';
import Lifespan from 'lifespan';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import HoodieApi from '~/services/hoodie.services.js';
import Log from '~/services/log.services.js';

import LocalClient from '../stores/local-client.stores.jsx';
import DOM from '../helpers/dom.helpers.js';
import {indivGroupsEditionTutorialLabel} from '../helpers/joyride.helpers.js';
import SliderHelpText from '../../images/sliders/helpText.json';

export class Sliders extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {};
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();

		this.client.getStore('/undoableStore', this.lifespan)
			.onUpdate((head) => {
				const headJS = head.toJS().d;

				this.setState({
					values: headJS.controlsValues,
				});
			})
			.onDelete(() => {
				this.setState(undefined);
			});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}


	render() {
		if (!this.state.values) {
			return false;
		}

		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] sliders');
		}
		const sliders = _.map(this.props.params, (param, i) => {
			const individualized = this.props.indivEdit;
			let value;
			const paramToUse = {};

			if (this.props.indivMode
				&& this.props.indivEdit
				&& this.state.values.indiv_group_param[this.props.currentGroup]) {
				const paramObject = this.state.values.indiv_group_param[this.props.currentGroup][`${param.name}_rel`] || {state: 'relative', value: 1};

				value = paramObject.value;
					_.assign(paramToUse, param, {
						state: paramObject.state,
						name: `${param.name}_rel`,
						max: paramObject.state === 'relative' ? 1.5 : (param.max - param.min) / 2,
						min: paramObject.state === 'relative' ? 0.5 : -(param.max - param.min) / 2,
						maxAdvised: paramObject.state === 'relative' ? 1.25 : (param.max - param.min) / 4,
						minAdvised: paramObject.state === 'relative' ? 0.25 : -(param.max - param.min) / 4,
						init: paramObject.state === 'relative' ? 1 : 0,
					});
			}
			else {
				_.assign(paramToUse, param);
				value = this.state.values ? this.state.values[param.name] : undefined;
			}

			const isRadio = paramToUse.controlType === 'radio';

			return isRadio
				? (
					<RadioSlider
						demo={paramToUse.demo}
						disabled={paramToUse.disabled}
						init={paramToUse.init}
						label={paramToUse.label}
						max={paramToUse.max}
						maxAdvised={paramToUse.maxAdvised}
						min={paramToUse.min}
						minAdvised={paramToUse.minAdvised}
						name={paramToUse.name}
						child={paramToUse.child}
						key={paramToUse.name + i}
						value={value}
						state={paramToUse.state}
						individualized={individualized}
						controlType={paramToUse.controlType}
						radioValues={paramToUse.radioValues}/>
				)
				: (
					<Slider
						demo={paramToUse.demo}
						credits={this.props.credits}
						disabled={paramToUse.disabled}
						init={paramToUse.init}
						label={paramToUse.label}
						max={paramToUse.max}
						maxAdvised={paramToUse.maxAdvised}
						min={paramToUse.min}
						minAdvised={paramToUse.minAdvised}
						name={paramToUse.name}
						child={paramToUse.child}
						key={paramToUse.name + i}
						value={value}
						state={paramToUse.state}
						individualized={individualized}/>
				);
		});

		return (
			<div className="sliders">
				{sliders}
			</div>
		);
	}
}

export class Slider extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
		this.openGoProModal = this.openGoProModal.bind(this);
		this.changeParam = this.changeParam.bind(this);
	}

	componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	resetValue() {
		this.client.dispatchAction('/change-param', {value: this.props.init, name: this.props.name, label: this.props.label, demo: this.props.demo});
	}

	showTooltip(sliderName) {
		const selector = '#prototyposlidertooltip';
		const button = 'slider-tooltip';
		const outsideClick = (event) => {
			if (!event.target.closest(selector) && event.target.className !== button) {
				this.client.dispatchAction('/store-value', {uiSliderTooltip: {display: false}});
				document.body.removeEventListener('click', outsideClick);
			}
			if (event.target.className === button) {
				document.body.removeEventListener('click', outsideClick);
			}
		};

		this.client.dispatchAction('/store-value', {uiSliderTooltip: {display: true, sliderName}});
		document.body.addEventListener('click', outsideClick);
	}

	openGoProModal() {
		window.Intercom('trackEvent', 'clickOnExportYourFontNow');
		this.client.dispatchAction('/store-value', {openGoProModal: true});
		Log.ui('ExportFontNow.open');
	}

	changeParam(params) {
		params.demo = this.props.demo;
		this.client.dispatchAction('/change-param', params);
	}

	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] slider');
		}
		const value = this.props.value === undefined ? this.props.init : this.props.value;
		const freeAccount = HoodieApi.instance && HoodieApi.instance.plan.indexOf('free_') !== -1;
		const credits = this.props.credits;
		const freeAccountAndHasCredits = (credits && credits > 0) && freeAccount;
		const disabled = !this.props.disabled && (!(freeAccountAndHasCredits || !freeAccount) && !this.props.demo);

		const classes = classNames({
			'slider': true,
			'is-coming': this.props.disabled,
			'is-child': this.props.child,
			'is-disabled': disabled,
		});

		const devOverlay = this.props.disabled
			? (
				<div className="slider-demo-overlay-text">
					This feature is currently in development
				</div>
			)
			: false;

		const demoOverlay = disabled
			? (
				<div onClick={this.openGoProModal} className="slider-demo-overlay-text">
					This feature is available with the full version
					<div className="slider-demo-overlay-text-more">
						<div className="slider-demo-overlay-text-more-text">Upgrade to full version</div>
					</div>
				</div>
			)
			: false;

		const indivSwitch = this.props.individualized
			? (
				<IndivSwitch name={this.props.name} state={this.props.state}/>
			)
			: false;

		let sliderTooltipButton;

		if (SliderHelpText[this.props.name]) {
			sliderTooltipButton = (
				<div className="slider-tooltip" onClick={() => {this.showTooltip(this.props.name);}}>?</div>
			);
		}

		return (
			<div className={classes}>
				<div className="slider-demo-overlay">
					{devOverlay}
					{demoOverlay}
				</div>
				<label className="slider-title">{this.props.label}</label>
				{sliderTooltipButton}
				<div className="slider-reset" onClick={() => {this.resetValue();}}>reset</div>
				<SliderTextController value={value} name={this.props.name} label={this.props.label} disabled={this.props.disabled} individualized={this.props.individualized} changeParam={this.changeParam}/>
				<div className="slider-container">
					<SliderController value={value}
						name={this.props.name}
						individualized={this.props.individualized}
						label={this.props.label}
						min={this.props.min}
						max={this.props.max}
						minAdvised={this.props.minAdvised}
						maxAdvised={this.props.maxAdvised}
						disabled={this.props.disabled}
						changeParam={this.changeParam}
						child={this.props.child}/>
					{indivSwitch}
				</div>
			</div>
		);
	}
}

export class RadioSlider extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] slider');
		}
		const value = this.props.value === undefined ? this.props.init : this.props.value;

		const classes = Classnames({
			'slider': true,
			'radio-slider': true,
			'is-coming': this.props.disabled,
			'is-child': this.props.child,
		});

		const demoOverlay = this.props.disabled
			? (
				<div className="slider-demo-overlay-text">
					This feature is currently in development
				</div>
			)
			: false;

		const indivSwitch = this.props.individualized
			? (
				<IndivSwitch name={this.props.name} state={this.props.state}/>
			)
			: false;

		return (
			<div className={classes}>
				<div className="slider-demo-overlay">
					{demoOverlay}
				</div>
				<label className="slider-title">{this.props.label}</label>
				<div className="slider-container">
					<SliderRadioController
						value={value}
						name={this.props.name}
						individualized={this.props.individualized}
						label={this.props.label}
						disabled={this.props.disabled}
						child={this.props.child}
						radioValues={this.props.radioValues}/>
					{indivSwitch}
				</div>
			</div>
		);
	}
}

export class SliderController extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

		// function bindings
		this.handleUp = this.handleUp.bind(this);
		this.handleMove = this.handleMove.bind(this);
		this.handleSelectstart = this.handleSelectstart.bind(this);
	}

	componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();

		document.addEventListener('mouseup', this.handleUp);
		window.addEventListener('mousemove', this.handleMove);
		document.addEventListener('selectstart', this.handleSelectstart);
	}

	componentDidMount() {
		const slider = this.refs.slider;

		this.sliderWidth = slider.offsetWidth;
	}

	componentWillUnmount() {
		this.lifespan.release();
		document.removeEventListener('mouseup', this.handleUp);
		window.removeEventListener('mousemove', this.handleMove);
		document.removeEventListener('selectstart', this.handleSelectstart);
	}

	handleDown(e) {
		if (this.props.disabled) {
			return;
		}

		this.tracking = true;
		const newX = e.pageX || e.screenX;
		const {offsetLeft} = DOM.getAbsOffset(this.refs.slider);
		let newValue = ((newX - offsetLeft) / this.sliderWidth * (this.props.max - this.props.min)) + this.props.min;

		newValue = Math.min(Math.max(newValue, this.props.min), this.props.max);

		this.props.changeParam({value: newValue, name: this.props.name, label: this.props.label});
		this.currentX = newX;

		e.stopPropagation();
	}

	handleUp(e) {
		if (!this.tracking) {
			return;
		}

		this.tracking = false;
		this.props.changeParam({value: this.props.value, name: this.props.name, label: this.props.label, force: true});

		e.stopPropagation();
	}

	handleMove(e) {
		if (!this.tracking) {
			return;
		}

		const newX = e.pageX || e.screenX;
		const el = this.refs.slider;
		const {offsetLeft} = DOM.getAbsOffset(el);
		let newValue;

		if (newX >= offsetLeft && newX <= offsetLeft + el.clientWidth) {
			const variation = (newX - this.currentX) / this.sliderWidth * (this.props.max - this.props.min);

			newValue = this.props.value + variation;

			newValue = Math.min(Math.max(newValue, this.props.min), this.props.max);
		}
		else {
			newValue = newX < offsetLeft ? this.props.min : this.props.max;
		}

		this.props.changeParam({value: newValue, name: this.props.name});
		this.currentX = newX;
	}

	// This prevents preview text to be selected whil using the sliders
	handleSelectstart(e) {
		if (this.tracking) {
			return e.preventDefault();
		}
	}

	handleClick() {

	}

	render() {
		const translateX = (this.props.max - Math.min(Math.max(this.props.value, this.props.min), this.props.max)) / (this.props.max - this.props.min) * 92.0;
		const transform = {
			transform: `translateX(-${translateX}%)`,
		};

		const classes = classNames({
			'slider-controller-bg': true,
			'is-not-advised': this.props.value < this.props.minAdvised || this.props.value > this.props.maxAdvised,
			'is-indiv': this.props.individualized,
		});

		return (
			<div className="slider-controller" ref="slider"
				onMouseDown={(e) => { this.handleDown(e);}}>
				<div className={classes} style={transform}>
					<div
						className="slider-controller-handle"
						ref="handle" ></div>
				</div>
			</div>
		);
	}
}

export class SliderRadioController extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

		//function binding to avoid unnecessery re-render
		this.handleChange = this.handleChange.bind(this);
	}

	componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();

	}

	componentDidMount() {
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	handleChange(e) {
		if (e.target) {
			if (e.target.value !== undefined) {
				this.props.changeParam({
					value: e.target.value,
					name: this.props.name,
					label: this.props.label,
				});
			}
		}
	}

	render() {
		const boxes = this.props.radioValues.map((item) => {
			return item.value;
		});

		const checkBoxes = boxes.map((boxValue, index) => {
			const isSelected = boxValue === this.props.value;

			return (
				<div className="radio-button-container" key={index}>
					<label>
						<input
							onChange={this.handleChange}
							value={boxValue} checked={isSelected}
							type="radio"
							name={`radio-button-${String(this.props.name).trim()}`} />
						<span className="box-value-label">
							{boxValue}
						</span>
					</label>
				</div>
			);
		});

		return (
			<div className="radio-buttons-wrap">
				{checkBoxes}
			</div>
		);
	}
}

export class SliderTextController extends React.PureComponent {
	constructor(props) {
		super(props);

		this.handleChange = this.handleChange.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.state = {
			isTyping: false,
		};
	}

	componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	handleChange(e) {
		this.props.changeParam({
			name: this.props.name,
			value: parseFloat(e.target.value),
			label: this.props.label,
		});
	}

	handleClick() {
		this.setState({isTyping: true});
	}

	handleBlur() {
		this.setState({isTyping: false});
	}

	render() {
		const classes = classNames({
			'slider-text-controller': true,
			'is-indiv': this.props.individualized,
		});

		return (
			<input
				className={classes}
				type="number"
				value={this.state.isTyping ? this.props.value : this.props.value.toFixed(2)}
				onChange={this.handleChange}
				onClick={this.handleClick}
				onBlur={this.handleBlur}
				disabled={this.props.disabled}
			/>
		);
	}
}

class IndivSwitch extends React.Component {
	constructor(props) {
		super(props);
		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
	}

	componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();
	}

	componentDidMount() {
		this.client.dispatchAction('/store-value', {
			uiJoyrideTutorialValue: indivGroupsEditionTutorialLabel,
		});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	changeState(state) {
		this.client.dispatchAction('/change-param-state', {
			name: this.props.name,
			state,
			label: this.props.label,
		});
	}

	render() {

		const indivRelative = classNames({
			'indiv-switch-btn': true,
			'indiv-switch-relative': true,
			'is-active': this.props.state === 'relative',
		});

		const indivDelta = classNames({
			'indiv-switch-btn': true,
			'indiv-switch-delta': true,
			'is-active': this.props.state === 'delta',
		});

		return (
			<div className="indiv-switch">
				<div className={indivRelative} onClick={() => {this.changeState('relative');}}>
					&times;
				</div>
				<div className={indivDelta} onClick={() => {this.changeState('delta');}}>
					+
				</div>
			</div>
		);
	}
}
