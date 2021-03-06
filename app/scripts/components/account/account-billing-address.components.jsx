import React from 'react';
import Lifespan from 'lifespan';

import BillingAddress from '../shared/billing-address.components.jsx';
import AccountValidationButton from '../shared/account-validation-button.components.jsx';
import FormError from '../shared/form-error.components.jsx';
import FormSuccess from '../shared/form-success.components.jsx';

import LocalClient from '../../stores/local-client.stores.jsx';

export default class AccountBillingAddress extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			inError: {},
			errors: [],
			loaded: false,
		};
	}

	async componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();

		const userStore = await this.client.fetch('/userStore');

		this.setState({
			loaded: true,
			address: userStore.head.toJS().infos.address || {},
			buyerName: userStore.head.toJS().infos.buyerName || '',
			errors: userStore.head.toJS().billingForm.errors,
			inError: userStore.head.toJS().billingForm.inError,
			loading: userStore.head.toJS().billingForm.loading,
		});

		this.client.getStore('/userStore', this.lifespan)
			.onUpdate((head) => {
				this.setState({
					address: head.toJS().d.infos.address || {},
					buyerName: head.toJS().d.infos.buyerName || '',
					errors: head.toJS().d.billingForm.errors,
					inError: head.toJS().d.billingForm.inError,
					loading: head.toJS().d.billingForm.loading,
				});
			})
			.onDelete(() => {
				this.setState(undefined);
			});
	}

	componentWillUnmount() {
		this.client.dispatchAction('/clean-form', 'billingForm');
		this.lifespan.release();
	}

	addAddress(e) {
		e.preventDefault();
		this.client.dispatchAction('/add-billing-address', {
			buyerName: this.refs.address.getBuyerName(),
			address: this.refs.address.getAddress(),
			pathQuery: {
				path: '/account/details/billing-address',
				query: {
					newBilling: true,
				},
			},
		});
	}

	render() {
		const billingAddress = this.state.loaded
			? <BillingAddress ref="address" address={this.state.address} buyerName={this.state.buyerName} inError={this.state.inError}/>
			: false;

		const errors = this.state.errors.map((err) => {
			return <FormError errorText={err}/>;
		});

		const success = this.props.location.query.newBilling
			? <FormSuccess successText="You've successfully changed your billing address"/>
			: false;

		return (
			<form onSubmit={(e) => {this.addAddress(e);}} className="account-base account-billing-address">
				{billingAddress}
				{errors}
				{success}
				<AccountValidationButton loading={this.state.loading} label="Confirm address change"/>
			</form>
		);
	}
}
