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

export const compileComponent = (componentClass) => {

  let selector = appWriter.get('selector', componentClass);
  let parentScope, elementRef, component, isolateScope;

  inject(($compile, $rootScope) => {
    let controllerAs = componentWriter.get('controllerAs', componentClass);
    let template = componentWriter.get('template', componentClass);
    let componentInstance = new componentClass();

    parentScope = $rootScope.$new();
    parentScope[controllerAs] = componentInstance;
    elementRef = angular.element(template);
    elementRef = $compile(elementRef)(parentScope);
    parentScope.$digest();

    isolateScope = elementRef.isolateScope();
    component = isolateScope.someComponent;

    console.log(1, Object.keys(isolateScope).filter(k => !k.startsWith('$')));
    console.log(2, isolateScope.someComponent);
    console.log(2, isolateScope.test);
    console.log(2, component);
    console.log(3, Object.keys(parentScope).filter(k => !k.startsWith('$')));
  });

  return {elementRef, component, isolateScope, parentScope};
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
  bindFn(bind);
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

    componentWriter.forEach((val, key) => ::console.log(key, val),
        rootComponent);

    let compiledComponent = compileComponent(rootComponent);
    _bindings = [];
    return compiledComponent;
  }

  overrideTemplate()      { throw new Error('not implemented'); }
  overrideView()          { throw new Error('not implemented'); }
  overrideDirective()     { throw new Error('not implemented'); }
  overrideBindings()      { throw new Error('not implemented'); }
  overrideViewBindings()  { throw new Error('not implemented'); }
}