/* global it, describe */
import '../tests/frameworks';
import {propertiesMap, propertiesBuilder} from './properties-builder';
import {Component} from '../decorators/providers/component';
import {View} from '../decorators/component/view';
import {Inject} from '../decorators/inject';
import bundle from '../bundle';
import bootstrap from '../bootstrap';
import {ng} from '../tests/angular';
import {compileHtmlAndScope, compileComponent, bindings, TestComponentBuilder, DebugElement} from '../tests/utils';

import {providerWriter} from '../writers';

describe('properties-builder', () => {

  describe('propertiesMap', () => {
    it('should return map of three isolate scope properties per property', () => {
      let properties = {
        foo: 'foo'
      };

      let definition = propertiesMap(properties);
      expect(definition).to.eql({
        '_bind_string_foo': '@foo',
        '[foo]': '&',
        '[(foo)]': '=?'
      });
    });

    it('should return map of for properties with local vs. public name', () => {
      let properties = {
        fooLocal: 'fooPublic'
      };

      let definition = propertiesMap(properties);
      expect(definition).to.eql({
        '_bind_string_fooLocal': '@fooPublic',
        '[fooPublic]': '&',
        '[(fooPublic)]': '=?'
      });
    });

    it('should return empty map if there are no properties', () => {
      let properties = {};

      let definition = propertiesMap(properties);
      expect(definition).to.eql({});
    });
  });

  describe('propertiesBuilder', () => {
    let controller;

    beforeEach(() => {
      controller = {};
    });

    describe('with localKey same as publicKey', () => {

      beforeEach(() => {
        propertiesBuilder(controller, 'foo', 'foo');
      });

      it('should add one visible and several hidden properties to controller', () => {
        let visibleProps = [];
        for (let key in controller) {
          visibleProps.push(key);
        }

        expect(controller).to.have.property('_bind_string_foo');
        expect(controller).to.have.property('[foo]');
        expect(controller).to.have.property('[(foo)]');
        expect(visibleProps).to.have.length(1);
        expect(visibleProps[0]).to.equal('foo');
      });

      it('should only be able to read from string property', () => {
        controller['[foo]'] = sinon.stub();
        // simulate angular setting value with hidden property
        controller['_bind_string_foo'] = 'bar';

        expect(controller.foo).to.equal('bar');
        controller.foo = 'quux'; // this has no effect;
        expect(controller.foo).to.equal('bar');
      });

      it('should only be able to read from one-way property', () => {
        // simulate angular one way fn binding, special for one-way only
        controller['[foo]'] = sinon.stub().returns('bar');

        expect(controller.foo).to.equal('bar');
        controller.foo = 'quux'; // this has no effect;
        expect(controller.foo).to.equal('bar');
      });

      it('should be able to read and write a two-way property', () => {
        // simulate angular setting value with hidden property
        controller['[foo]'] = sinon.stub();
        // simulate angular one way fn binding, special for one-way only
        controller['[(foo)]'] = 'bar';

        expect(controller.foo).to.equal('bar');
        controller.foo = 'quux';
        expect(controller.foo).to.equal('quux');
        expect(controller['[(foo)]']).to.equal('quux');
      });

      it('should not allow using more than one binding type', () => {
        controller['[foo]'] = sinon.stub().returns('bar');
        expect(controller['[(foo)]']).to.throw;
      });
    });

    describe('with localKey different than publicKey', () => {
      beforeEach(() => {
        propertiesBuilder(controller, 'fooLocal', 'fooPublic');
      });

      it('should add one visible and several hidden properties to controller', () => {
        let visibleProps = [];
        for (let key in controller) {
          visibleProps.push(key);
        }

        expect(controller).to.have.property('_bind_string_fooLocal');
        expect(controller).to.have.property('[fooPublic]');
        expect(controller).to.have.property('[(fooPublic)]');
        expect(visibleProps).to.have.length(1);
        expect(visibleProps[0]).to.equal('fooLocal');
      });

      it('should only be able to read from string property', () => {
        controller['[fooPublic]'] = sinon.stub();
        // simulate angular setting value with hidden property
        controller['_bind_string_fooLocal'] = 'bar';

        expect(controller.fooLocal).to.equal('bar');
        controller.fooLocal = 'quux'; // this has no effect;
        expect(controller.fooLocal).to.equal('bar');
      });

      it('should only be able to read from one-way property', () => {
        // simulate angular one way fn binding, special for one-way only
        controller['[fooPublic]'] = sinon.stub().returns('bar');

        expect(controller.fooLocal).to.equal('bar');
        controller.fooLocal = 'quux'; // this has no effect;
        expect(controller.fooLocal).to.equal('bar');
      });

      it('should be able to read and write a two-way property', () => {
        // simulate angular setting value with hidden property
        controller['[fooPublic]'] = sinon.stub();
        // simulate angular one way fn binding, special for one-way only
        controller['[(fooPublic)]'] = 'bar';

        expect(controller.fooLocal).to.equal('bar');
        controller.fooLocal = 'quux';
        expect(controller.fooLocal).to.equal('quux');
        expect(controller['[(fooPublic)]']).to.equal('quux');
      });

      it('should not allow using more than one binding type', () => {
        controller['[fooPublic]'] = sinon.stub().returns('bar');
        expect(controller['[(fooPublic)]']).to.throw;
      });
    });
  });


  class SomeService {
    getData() { return 'real success' }
  }


  @Component({
    selector: 'some-component',
    properties: ['foo', 'baz:bar'],
    bindings: [SomeService]
  })
  @View({
    template: `{{someComponent.foo}} {{someComponent.baz}} {{someComponent.quux()}}`
  })
  @Inject(SomeService)
  class SomeComponent {
    constructor(SomeService) {
      console.log('hi', SomeService)
      Object.assign(this, {SomeService});
    }
    quux() { return this.SomeService.getData() }
  }


  @Component({selector: 'test'})
  @View({
    template: `<some-component foo="Hello" [bar]="test.bar"></some-component>`,
    directives: [SomeComponent]
  })
  class TestComponent {
    constructor() {
      this.bar = "World";
    }
  }

  describe.only('Angular Integration New (matches Angular 2 api)', () => {
    let component;
    let mockSomeService;
    let tcb;
    let rootTC;

    beforeEach(() => {
      ng.useReal();
      tcb = new TestComponentBuilder();
    });

    beforeEach(bindings(bind => {
      mockSomeService = {
        getData: sinon.stub().returns('mock success')
      };

      return [
        bind(SomeService).toValue(mockSomeService)
      ];
    }));

    it('component test', () => {
      rootTC = tcb.create(TestComponent);

      expect(rootTC).to.have.property('debugElement')
          .that.is.an.instanceOf(DebugElement);

      expect(rootTC.debugElement.nativeElement[0])
          .to.be.an.instanceOf(HTMLElement);

      expect(rootTC.debugElement.componentInstance)
          .to.be.an.instanceOf(TestComponent);

      expect(rootTC.debugElement.componentViewChildren)
          .to.be.an('array');

      expect(rootTC.debugElement.componentViewChildren[0])
          .to.be.an.instanceOf(DebugElement);

      expect(rootTC.debugElement.componentViewChildren[0].nativeElement[0])
          .to.be.an.instanceOf(HTMLElement);

      expect(rootTC.debugElement.componentViewChildren[0].componentInstance)
          .to.be.an.instanceOf(SomeComponent);

      let someComponent = rootTC.debugElement.componentViewChildren[0].nativeElement;

      expect(someComponent.text()).to.equal("Hello World mock success");
      expect(mockSomeService.getData).to.have.been.called;

      rootTC.debugElement.componentInstance.bar = "Angular 2";
      rootTC.detectChanges();
      expect(someComponent.text()).to.equal("Hello Angular 2 mock success");
    });
  });

  describe('Angular Integration Original', () => {
    let element;
    let parentScope;
    let controller;
    let isolateScope;

    beforeEach(() => {
      ng.useReal();
    });

    it('component test 1', () => {
      var ngfModule = bundle('someComponent', SomeComponent);
      angular.mock.module(ngfModule.name);
      angular.mock.module($provide => {
        $provide.value(providerWriter.get('name', SomeService), {
          getData() { return 'mock success' }
        });
      });

      let component = SomeComponent;
      let html = '<some-component foo="Hello" [bar]="bar"></some-component>';
      let initialScope = { bar: 'World' };

      ({parentScope, element, controller, isolateScope}
          = compileHtmlAndScope({component, html, initialScope}));

      expect(element.text()).to.equal("Hello World mock success");
    });
  });

});