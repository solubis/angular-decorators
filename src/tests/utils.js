import {appWriter, providerWriter, componentWriter} from '../writers';
import bundle from '../bundle';

export const compileHtmlAndScope = ({component, html, initialScope}) => {

  let selector = appWriter.get('selector', component);
  let parentScope, element, controller, isolateScope;

  inject(($compile, $rootScope) => {
    parentScope = $rootScope.$new();
    Object.assign(parentScope, initialScope);
    element = angular.element(html);
    element = $compile(element)(parentScope);
    parentScope.$digest();
    isolateScope = element.isolateScope();
    controller = element.controller(`${selector}`);
  });

  return {parentScope, element, controller, isolateScope};
};



// todo: have DebugElement be a jquery object that is decorated
export class DebugElement {
  constructor({nativeElement, componentInstance}) {
    console.log('new DebugElement', nativeElement, componentInstance);
    this._nativeElement = nativeElement;
    this._componentInstance = componentInstance;
    this._componentViewChildren = null;
  }
  get componentInstance() { return this._componentInstance; }
  get nativeElement() { return this._nativeElement; }
  get componentViewChildren() {
    if (this._componentViewChildren) {
      return this._componentViewChildren;
    }

    let children = [...this._nativeElement.children()]
        .map(el => {
          let isolateScope = angular.element(el).isolateScope();
          let name = dashToCamel(el.tagName.toLowerCase());
          let componentInstance = isolateScope[name];
          return new DebugElement({nativeElement: angular.element(el), componentInstance})
        });

    return this._componentViewChildren = children;

  }
  get elementRef() { throw new Error('not implemented'); }
  get children() { throw new Error('not implemented'); }
}



export const compileComponent = (componentClass) => {

  let selector = appWriter.get('selector', componentClass);
  let parentScope, nativeElement, component, isolateScope, componentInstance;

  inject(($compile, $rootScope) => {
    let controllerAs = componentWriter.get('controllerAs', componentClass);
    let template = componentWriter.get('template', componentClass);
    componentInstance = new componentClass();
    parentScope = $rootScope.$new();
    parentScope[controllerAs] = componentInstance;
    nativeElement = angular.element(`<span>${template}</span>`);
    nativeElement = $compile(nativeElement)(parentScope);
    parentScope.$digest();
  });

  return {
    debugElement: new DebugElement({
      nativeElement,
      componentInstance
    }),
    detectChanges() { parentScope.$digest(); }
  };
};



let _bindings = [];

export const bind = token => ({
  toValue(value) {
    _bindings.push({token: providerWriter.get('name', token), value});
  },
  toClass() { throw new Error('not implemented'); },
  toAlias() { throw new Error('not implemented'); },
  toFactory() { throw new Error('not implemented'); }
});

export const bindings = (bindFn) => {
  return isSpecRunning() ? workFn() : workFn;
  function workFn() {
    bindFn(bind);
  }
};



export class TestComponentBuilder {
  create(rootComponent) {
    let decoratedModule = bundle('test', rootComponent);
    angular.mock.module(decoratedModule.name);
    angular.mock.module($provide => {
      _bindings.forEach(({token, value}) => {
        $provide.value(token, value);
      });
    });

    //componentWriter.forEach((val, key) => ::console.log(key, val),
    //    rootComponent);

    let rootTC = compileComponent(rootComponent);
    _bindings = [];

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



export function camelToSnake(camelCase) {
  return camelCase.replace(/[A-Z]/g, function (match, pos) {
    return (pos > 0 ? '_' : '') + match.toLowerCase()
  })
}

export function ucFirst(word) {
  return word.charAt(0).toUpperCase() + word.substr(1)
}

export function dashToCamel(dash) {
  var words = dash.split('-')
  return words.shift() + words.map(exports.ucFirst).join('')
}