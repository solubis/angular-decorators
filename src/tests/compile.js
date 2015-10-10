import {appWriter, componentWriter} from '../writers';
import { debugElementFactory } from './debug-element';

/**
 * A function for compiling a decorated component into a root test component
 * @param componentClass
 * @returns {{debugElement: *, detectChanges: (function())}}
 */
export const compileComponent = (componentClass) => {

  let selector = appWriter.get('selector', componentClass);
  let parentScope, element, componentInstance;

  inject(($compile, $rootScope) => {
    let controllerAs = componentWriter.get('controllerAs', componentClass);
    let template = componentWriter.get('template', componentClass);
    componentInstance = new componentClass();
    parentScope = $rootScope.$new();
    parentScope[controllerAs] = componentInstance;
    element = angular.element(`<span>${template}</span>`);
    element = $compile(element)(parentScope);
    parentScope.$digest();
  });

  return {
    debugElement: debugElementFactory({
      nativeElement: element[0],
      componentInstance
    }),
    detectChanges() { parentScope.$digest(); }
  };
};


/**
 * A function for compiling an html template against a data object. This is
 * tested directives in regular angular 1. Recommended to use TestComponentBuilder
 * instead.
 *
 * @param component
 * @param html
 * @param initialScope
 * @returns {{parentScope: *, element: *, controller: *, isolateScope: *}}
 */
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