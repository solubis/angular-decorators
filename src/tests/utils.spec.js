/* global it, describe */
import './frameworks';
import {Component} from '../decorators/providers/component';
import {View} from '../decorators/component/view';
import {Inject} from '../decorators/inject';
import {ng} from './angular';
import {bindings, TestComponentBuilder} from './index';


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


describe('Test Utils', () => {

  let tcb;

  beforeEach(() => {
    ng.useReal();
    tcb = new TestComponentBuilder();
  });

  describe('Test Component Builder', () => {
    let component;
    let mockSomeService;
    let rootTC;
    let ngElementKeys = ['find', 'scope', 'controller', 'html', 'text', 'on', 'off', 'css'];

    beforeEach(bindings(bind => {
      mockSomeService = {
        getData: sinon.stub().returns('mock success')
      };

      return [
        bind(SomeService).toValue(mockSomeService)
      ];
    }));

    it('should return a root test component', () => {

      rootTC = tcb.create(TestComponent);

      expect(rootTC.debugElement.__proto__)
          .to.contain.all.keys(ngElementKeys);

      expect(rootTC.debugElement.nativeElement)
          .to.be.an.instanceOf(HTMLElement);

      expect(rootTC.debugElement.componentInstance)
          .to.be.an.instanceOf(TestComponent);

      expect(rootTC.debugElement.componentViewChildren)
          .to.be.an('array');

      expect(rootTC.debugElement.componentViewChildren[0].__proto__)
          .to.contain.all.keys(ngElementKeys);

      expect(rootTC.debugElement.componentViewChildren[0].nativeElement)
          .to.be.an.instanceOf(HTMLElement);

      expect(rootTC.debugElement.componentViewChildren[0].componentInstance)
          .to.be.an.instanceOf(SomeComponent);

      let someComponentEl = rootTC.debugElement.componentViewChildren[0];

      expect(someComponentEl.text()).to.equal("Hello World mock success");
      expect(mockSomeService.getData).to.have.been.called;

      rootTC.debugElement.componentInstance.bar = "Angular 2";
      rootTC.detectChanges();

      expect(someComponentEl.text()).to.equal("Hello Angular 2 mock success");
    });
  });
});