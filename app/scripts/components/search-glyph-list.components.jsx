import React from 'react';
import classNames from 'classnames';

import LocalClient from '../stores/local-client.stores.jsx';

export default class SearchGlyphList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	componentWillMount() {
		this.client = LocalClient.instance();
	}

	changeSearch() {
		this.client.dispatchAction('/search-glyph', {
			query: this.refs.search.value,
		});
	}

	saveSearch() {
		this.client.dispatchAction('/save-search-glyph', {
			query: this.refs.search.value,
		});
		this.refs.search.value = '';
	}

	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] SearchGlyphList');
		}

		const classes = classNames({
			'search-glyph-list': true,
		});

		return (
			<form className={classes}>
				<input className="search-glyph-list-input" tabIndex="-1" ref="search" placeholder="Search glyph…" type="text" onChange={() => { this.changeSearch(); }}/>
				<input className="search-glyph-list-submit" type="button" tabIndex="-1" onClick={() => { this.saveSearch();}}/>
			</form>
		);
	}
}
