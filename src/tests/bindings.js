import { providerWriter } from '../writers';
import bundle from '../bundle';
import { compileComponent } from './compile';

/**
 * Stores references to all bindings. Is cleared by TestComponentBuilder after a create call.
 * @type {Array}
 * @private
 */
let _bindings = [];

/**
 * Will add a binding object to the private bindings array.
 * Bindings are used during TestComponentBuilder's create call.
 * @param token
 */
export const bind = token => ({
  toValue(value) {
    _bindings.push({token: providerWriter.get('name', token), value});
  },
  toClass() { throw new Error('not implemented'); },
  toAlias() { throw new Error('not implemented'); },
  toFactory() { throw new Error('not implemented'); }
});

// todo: create Binding class, right now the return of array in beforeEach is too faked out

/**
 * A sugar function for use in a beforeEach block. Can use in one of two ways:
 *
 * beforeEach(bindings(bind => {}));
 * or
 * beforeEach(() => {
 *   bindings(bind => {});
 * })
 * @param bindFn
 * @returns {workFn}
 */
export const bindings = (bindFn) => {
  return isSpecRunning() ? workFn() : workFn;
  function workFn() {
    bindFn(bind);
  }
};

/**
 * TestComponentBuilder
 *
 * The preferred way to test components
 */
export class TestComponentBuilder {

  /**
   * Takes a root component, typically a test component whose template houses another component
   * under testing. Returns a rootTC (root test component) that contains a debugElement reference
   * to the test component (which you can use to drill down to the component under test) as well
   * as a detectChanges method which aliases to a scope digest call.
   *
   * @param rootComponent
   * @returns {{debugElement, detectChanges}|{debugElement: *, detectChanges: (function())}}
   */
  create(rootComponent) {
    let decoratedModule = bundle('test', rootComponent);
    angular.mock.module(decoratedModule.name);
    angular.mock.module($provide => {
      _bindings.forEach(({token, value}) => {
        $provide.value(token, value);
      });
    });

    let rootTC = compileComponent(rootComponent);
    _bindings = [];

    // todo: create RootTestComponent class
    return rootTC;
  }

  overrideTemplate()      { throw new Error('not implemented'); }
  overrideView()          { throw new Error('not implemented'); }
  overrideDirective()     { throw new Error('not implemented'); }
  overrideBindings()      { throw new Error('not implemented'); }
  overrideViewBindings()  { throw new Error('not implemented'); }
}

var currentSpec = null;
function isSpecRunning() {
  return !!currentSpec;
}
if (window.jasmine || window.mocha) {
  (window.beforeEach || window.setup)(function () {
    currentSpec = this;
  });
  (window.afterEach || window.teardown)(function () {
    currentSpec = null;
  });
}