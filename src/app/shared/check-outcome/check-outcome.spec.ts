import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckOutcome } from './check-outcome';
import { DiagnosisFinding, Explanation } from '../../core/operations/operations.models';

const ATC: DiagnosisFinding = {
  cause: 'atc-drift', confidence: 'certain',
  explanation: 'The received cryptogram belongs to a later transaction.',
  changes: [{ field: 'tag_9f36', label: 'Tag 9F36 (Application Transaction Counter)', from: '0001', to: '0002' }]
};
const CID: DiagnosisFinding = {
  cause: 'other-value', confidence: 'possible', note: 'A 3 digits value can match by chance about 1 time in 1,000.',
  explanation: 'The received value is the CID of this card.', changes: [],
  operation: { id: 'discover/cid', label: 'Discover CID', type: 'CID' }
};

describe('CheckOutcome', () => {
  let fixture: ComponentFixture<CheckOutcome>;
  let el: HTMLElement;

  function render(expected: string, received: string, explanation: Explanation = { status: 'idle' }, report = '') {
    fixture.componentRef.setInput('type', 'ARQC');
    fixture.componentRef.setInput('expected', expected);
    fixture.componentRef.setInput('received', received);
    fixture.componentRef.setInput('explanation', explanation);
    fixture.componentRef.setInput('report', report);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CheckOutcome] }).compileComponents();
    fixture = TestBed.createComponent(CheckOutcome);
    el = fixture.nativeElement;
  });

  it('shows a match', () => {
    render('949BBD6013450C7D', '949BBD6013450C7D');
    expect(el.querySelector('.outcome.ok')?.textContent).toContain('Match');
    expect(el.querySelector('.finding')).toBeNull();
  });

  it('shows a mismatch with the differing characters', () => {
    render('949BBD6013450C7D', '949BBD6013450C7E');
    expect(el.querySelector('.outcome.bad')?.textContent).toContain('No match');
    expect(el.querySelectorAll('.diff').length).toBe(1);
    expect(el.textContent).toContain('1 of 16 characters differ');
    expect(el.textContent).toContain('typing or copying mistake');
  });

  it('explains that a completely different value is normal for a cryptogram', () => {
    render('949BBD6013450C7D', '673A05ED91892AF8');
    expect(el.textContent).toContain('The whole value is different. That is normal');
    expect(el.textContent).not.toContain('characters differ');
  });

  it('shows that the cause is being looked for', () => {
    render('949BBD6013450C7D', '673A05ED91892AF8', { status: 'loading' });
    expect(el.textContent).toContain('Looking for the cause');
  });

  it('shows the cause with the exact change and applies it in one click', () => {
    render('949BBD6013450C7D', '673A05ED91892AF8', { status: 'done', diagnosis: { checked: 1, findings: [ATC] } });
    let applied: DiagnosisFinding | null = null;
    fixture.componentInstance.apply.subscribe(f => applied = f);
    const finding = el.querySelector('.finding')!;
    expect(finding.textContent).toContain('Cause found');
    expect(finding.textContent).toContain('later transaction');
    expect(finding.querySelector('.from')?.textContent).toBe('0001');
    expect(finding.querySelector('.to')?.textContent).toBe('0002');
    (finding.querySelector('.apply-btn') as HTMLButtonElement).click();
    expect(applied).toBe(ATC);
  });

  it('is honest when a short value may match by chance, and offers the other value', () => {
    render('561', '636', { status: 'done', diagnosis: { checked: 1, findings: [CID] } });
    const finding = el.querySelector('.finding.possible')!;
    expect(finding.textContent).toContain('Possible cause');
    expect(finding.textContent).toContain('1 time in 1,000');
    expect(finding.querySelector('.apply-btn')?.textContent).toContain('Switch to Discover CID');
  });

  it('says so when none of the common causes explains the mismatch', () => {
    render('949BBD6013450C7D', '0123456789ABCDEF', { status: 'done', diagnosis: { checked: 13, findings: [] } });
    expect(el.querySelector('.none')?.textContent).toContain('We recalculated 13 variants');
    expect(el.querySelector('.apply-btn')).toBeNull();
  });

  it('marks a match reached by applying a change', () => {
    render('673A05ED91892AF8', '673A05ED91892AF8');
    fixture.componentRef.setInput('applied', ATC);
    fixture.detectChanges();
    expect(el.querySelector('.applied')?.textContent).toContain('Matched after the change');
  });

  it('copies the check report, or shows it when the browser blocks copying', async () => {
    render('949BBD6013450C7D', '673A05ED91892AF8', { status: 'idle' }, 'REPORT');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await fixture.componentInstance.copy();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledWith('REPORT');
    expect(el.querySelector('.copy-btn')?.textContent).toContain('Copied');

    writeText.mockRejectedValue(new Error('blocked'));
    await fixture.componentInstance.copy();
    fixture.detectChanges();
    expect(el.querySelector('.report')?.textContent).toBe('REPORT');
  });
});
