import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDebounce } from 'use-debounce';
import {
	Panel,
	PanelBody,
	PanelRow,
	RangeControl,
	Button,
	SearchControl,
	Dropdown,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item
} from '@wordpress/components';


function Edit( props ) {
	const {
		setAttributes,
		isSelected,
		attributes: {
			showId,
			iconSize,
		},
	} = props;

	/** State for the search text for the show name. Defaults to empty string. */
	const [ searchText, setSearchText ] = useState( '' );

	/** Debounced search text so that we don't trigger useEffect() for every character change. */
	const [ debouncedSearchText ] = useDebounce( searchText, 300 );

	/** State for search results matched by the search text. Defaults to array. */
	const [ searchResults, setSearchResults ] = useState( [] );

	/** State for the icon theme. Defaults to `color`. */
	const [ iconTheme, setIconTheme ] = useState( 'color' );

	/** State for platforms returned for a specific show. Defaults to array. */
	const [ platforms, setPlatforms ] = useState( [] );

	/**
	 * Hits the `/wp/v2/search` endpoint to search for
	 * podcast show by name.
	 */
	useEffect( () => {
		const searchPodcastShow = async () => {
			if ( ! searchText.length ) {
				setSearchResults( [] );
				return;
			}

			/** Query object required by `/wp/v2/search` to search for a term by name. */
			const queryObject = {
				search: searchText,
				type: 'term',
				subtype: 'podcasting_podcasts'
			};

			/** Converts an object to query-string. */
			const queryString = new URLSearchParams( queryObject ).toString();

			/** Returns the results of the search. */
			const searchResults = await apiFetch( {
				path: `/wp/v2/search?${ queryString }`,
			} );

			setSearchResults( searchResults );
		};

		searchPodcastShow();
	}, [ debouncedSearchText ] );

	/**
	 * Fetches the podcasting platforms for a show whenever
	 * showId updates.
	 */
	useEffect( () => {
		if ( ! showId ) {
			return;
		}

		/**
		 * Responsible to fetch platforms for a show by show ID.
		 * @returns void
		 */
		const fetchPlatforms = async () => {
			const result = await apiFetch( {
				url: `${ ajaxurl }?show_id=${ showId }&action=get_podcast_platforms`,
			} );

			if ( ! result.success ) {
				return;
			}

			const {
				data: { platforms, theme }
			} = result;

			setPlatforms( platforms );
			setIconTheme( theme );
		};

		fetchPlatforms();
	}, [ showId ] );

	/**
	 * Handler to set the attribute showId.
	 *
	 * @param {Int} termId The show ID.
	 * @returns void
	 */
	const onShowSelect = ( termId ) => {
		setAttributes( { showId: termId } );
	};

	/**
	 * Handler to set size of the icon.
	 *
	 * @param {Int} size The icon size in `px`
	 */
	const setIconSize = ( size ) => {
		setAttributes( { iconSize: size } );
	};

	/**
	 * Sets the HTML attributes for the root element.
	 */
	const blockProps = useBlockProps( {
		className: isSelected ? 'simple-podcasting__podcast-platforms simple-podcasting__podcast-platforms--selected' : 'simple-podcasting__podcast-platforms',
	} );

	const platformSlugs = Object.keys( platforms );

	return (
		<>
			<InspectorControls>
				<Panel header={ __( 'Customization Controls', 'simple-podacsting' ) }>
					<PanelBody>
						<PanelRow>
							<RangeControl
								label={ __( 'Icon sizes', 'simple-podcasting' ) }
								min={ 16 }
								max={ 96 }
								step={ 16 }
								value={ iconSize }
								onChange={ setIconSize }
							/>
						</PanelRow>
					</PanelBody>
				</Panel>
			</InspectorControls>
			<div { ...blockProps }>
				{
					platformSlugs.length ? (
						<div className='simple-podcasting__podcasting-platform-list'>
							{
								platformSlugs.map( ( platform, index ) => {
									return (
										<span key={ index } className='simple-podcasting__podcasting-platform-list-item'>
											<a href={ platforms[ platform ] } target="_blank">
												<img className={ `simple-pocasting__icon-size--${ iconSize }` } src={ `${ podcastingPlatformVars.podcastingUrl }dist/images/icons/${ platform }/${ iconTheme }-100.png` } />
											</a>
										</span>
									);
								} )
							}
						</div>
					) : null
				}
				{
					isSelected || ! showId ? (
						<Dropdown
							className="simple-podcasting__select-show-popover"
							contentClassName="simple-podcasting__select-show-popover"
							position="bottom right"
							onClose={ () => setSearchText( '' ) }
							renderToggle={ ( { isOpen, onToggle } ) => (
								<>
									{ ! showId && <p>{ __( 'Select a Podcast Show using the button below:', 'simple-podcasting' ) }</p> }
									{ showId && ! platformSlugs.length && <p>{ __( 'No platforms set for this show.', 'simple-podcasting' ) }</p> }
									<Button
										variant="primary"
										onClick={ onToggle }
										aria-expanded={ isOpen }
										text={ __( 'Select a Show', 'simple-podcasting' ) }
									/>
								</>
							) }
							renderContent={ ( { isOpen, onToggle, onClose } ) => (
								<div>
									<SearchControl
										placeholder={ __( 'Search a Podcast Show', 'simple-podcasting' ) }
										onChange={ ( searchText ) => setSearchText( searchText ) }
										value={ searchText }
									/>
									<ItemGroup
										isSeparated
									>
										{
											searchResults.length ? (
												searchResults.map( ( result ) => (
													<Item
														key={ result.id }
														className='simple-podcasting__podcast-search-results'
														onClick={ () => {
															onShowSelect( result.id );
															onClose();
														} }
													>
														{ result.title }
													</Item>
												) )
											) : false
										}
									</ItemGroup>
								</div>
							) }
						/>
					) : null
				}
			</div>
		</>
	)
}

export default Edit;