import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChipDataPaste } from './chip-data-paste';
import { buildTlv } from '../../core/emv/tlv';

const FIELD_55 = buildTlv([['9F02', '000000010000'], ['9F37', '12345678'], ['9F36', '0001'], ['9F27', '80']]);

describe('ChipDataPaste', () => {
  let fixture: ComponentFixture<ChipDataPaste>;
  let component: ChipDataPaste;
  let el: HTMLElement;
  let emitted: Record<string, string>[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChipDataPaste] }).compileComponents();
    fixture = TestBed.createComponent(ChipDataPaste);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('targets', ['tag_9f02', 'tag_9f37', 'tag_9f36', 'tag_9f10']);
    fixture.componentRef.setInput('example', FIELD_55);
    emitted = [];
    component.filled.subscribe(v => emitted.push(v));
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  function open() {
    (el.querySelector('.toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('starts closed and opens on click', () => {
    expect(el.querySelector('textarea')).toBeNull();
    open();
    expect(el.querySelector('textarea')).toBeTruthy();
  });

  it('reads the example, fills only the fields this form has and lists every tag', () => {
    open();
    (el.querySelector('.link-btn') as HTMLButtonElement).click();    // Use example chip data
    fixture.detectChanges();
    expect(emitted).toEqual([{ tag_9f02: '000000010000', tag_9f37: '12345678', tag_9f36: '0001' }]);
    expect(el.textContent).toContain('Filled 3 fields');
    expect(el.textContent).toContain('Still to fill: 9F10');
    (el.querySelector('.tags-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const rows = Array.from(el.querySelectorAll('tbody tr')).map(r => r.textContent ?? '');
    expect(rows.length).toBe(4);
    expect(rows[0]).toContain('Amount, Authorised');
    expect(rows[3]).toContain('not needed');                           // 9F27 is not used by this form
  });

  it('keeps the decoded tags closed until asked, so the form stays in view', () => {
    open();
    (el.querySelector('.link-btn') as HTMLButtonElement).click();    // Use example chip data
    fixture.detectChanges();
    const toggle = el.querySelector('.tags-toggle') as HTMLButtonElement;
    expect(toggle.textContent).toContain('Decoded tags (4)');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('table')).toBeNull();
    toggle.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('tbody tr').length).toBe(4);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    fixture.detectChanges();
    expect(el.querySelector('table')).toBeNull();
  });

  it('accepts pasted data with spaces and shows clear errors for broken data', () => {
    open();
    component.setText('9F36 02 0001');
    component.read();
    expect(emitted).toEqual([{ tag_9f36: '0001' }]);
    component.setText('9F36 02 00');
    component.read();
    fixture.detectChanges();
    expect(el.querySelector('.error')?.textContent).toContain('ends early');
    expect(emitted.length).toBe(1);
  });

  it('says so when none of the tags are used by this form', () => {
    open();
    component.setText(buildTlv([['9F27', '80']]));
    component.read();
    fixture.detectChanges();
    expect(el.querySelector('.error')?.textContent).toContain('None of the tags');
    expect(emitted.length).toBe(0);
  });
});
