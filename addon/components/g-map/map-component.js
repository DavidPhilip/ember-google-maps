import Component from '@ember/component';
import ProcessOptions from '../../mixins/process-options';
import RegisterEvents from '../../mixins/register-events';
import PublicAPI from '../../utils/public-api';
import { get, set } from '@ember/object';
import { tryInvoke } from '@ember/utils';
import { defer, resolve } from 'rsvp';
import { assert } from '@ember/debug';

const MapComponentAPI = {
  map: 'map',
  mapComponent: 'mapComponent',
  isInitialized: 'isInitialized',
  actions: {
    update: '_updateComponent'
  }
};

/**
 * @class MapComponent
 * @module ember-google-maps/components/g-map/map-component
 * @namespace GMap
 * @extends Component
 * @uses ProcessOptions
 * @uses RegisterEvents
 */
const MapComponent = Component.extend(ProcessOptions, RegisterEvents, {
  tagName: '',
  
  class: '',
  
  _type: null,
  _requiredOptions: ['map'],

  init() {
    this._super(...arguments);

    assert('You must set a _type property on the map component.', this._type);

    this._registrationType = this._pluralType || `${this._type}s`;

    this.isInitialized = defer();
    this.isInitialized.promise.then(() => set(this, '_isInitialized', true));

    this.publicAPI = new PublicAPI(this, MapComponentAPI);
  },

  didInsertElement() {
    this._super(...arguments);

    this._internalAPI._registerComponent(this._registrationType, this.publicAPI);

    this._updateOrAddComponent();
  },

  didUpdateAttrs() {
    this._super(...arguments);

    this._updateOrAddComponent();
  },

  willDestroyElement() {
    this._super(...arguments);

    tryInvoke(this.mapComponent, 'setMap', [null]);

    this.publicAPI.remove(this);

    this._internalAPI._unregisterComponent(this._registrationType, this.publicAPI);
  },

  _updateOrAddComponent() {
    if (!get(this, 'map')) { return; }

    if (this._isInitialized) {
      this._updateComponent();
    } else {
      resolve()
        .then(() => this._addComponent())
        .then(() => this._didAddComponent());
    }
  },

  /**
   * Run when the map component is first initialized. Normally this happens as
   * soon as the map is ready.
   *
   * @method _addComponent
   * @return
   */
  _addComponent() {
    assert('Map components must implement the _addComponent hook.');
  },

  /**
   * Run after the map component has been initialized. This hook should be used
   * to register events, etc.
   *
   * @method _didAddComponent
   * @return
   */
  _didAddComponent() {
    this._registerOptionObservers();
    this.registerEvents();
    this.isInitialized.resolve();
  },

  /**
   * Run when any of the attributes or watched options change.
   *
   * @method _updateComponent
   * @return
   */
  _updateComponent() {
    let options = get(this, '_options');
    this.mapComponent.setOptions(options);
  }
});

export default MapComponent;
