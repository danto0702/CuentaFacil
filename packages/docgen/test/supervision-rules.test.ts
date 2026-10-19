import { describe, expect, it } from 'vitest';
import { buildTemplateContext, ebsCoordinatorText } from '../src/context.js';
import { renderDocx } from '../src/render.js';
import { syntheticAccount } from '../src/sample.js';
import { buildHrnoActivityTemplate, buildHrnoSupervisionTemplate } from '../src/templates/hrno.js';
import { docxPlainText } from '../src/text.js';

const COORDINATORS = [
  {
    municipalities: ['ABREGO', 'EL CARMEN'],
    name: 'COORDINADOR UNO',
    docNumber: '1000000009',
    docIssuedIn: 'Cúcuta',
  },
  { municipalities: ['CONVENCIÓN', 'TEORAMA'], name: 'COORDINADORA DOS', docNumber: '', docIssuedIn: '' },
];

describe('supervision report rules (owner, 2026-10-19)', () => {
  it('names the EBS coordinator of the municipality, only for Basic Health Team contracts', () => {
    expect(
      ebsCoordinatorText(
        'PRESTACIÓN DE SERVICIOS COMO MÉDICO GENERAL PARA LA CONFORMACIÓN DEL EQUIPO BÁSICO DE ATENCIÓN No. 004 … EN EL MUNICIPIO DE ABREGO',
        COORDINATORS,
      ),
    ).toBe('COORDINADOR UNO, identificado(a) con cédula de ciudadanía número 1.000.000.009 de Cúcuta');
    expect(
      ebsCoordinatorText(
        'FACTURACIÓN … EN EL MARCO DE LA EJECUCIÓN DE LOS EQUIPOS BÁSICOS DE SALUD … EN EL MUNICIPIO DE TEORAMA',
        COORDINATORS,
      ),
    ).toBe('COORDINADORA DOS');
    // Not an EBS contract, or a municipality without coordinator: no row.
    expect(ebsCoordinatorText('COORDINADOR ADMINISTRATIVO DE SALUD PÚBLICA, ABREGO', COORDINATORS)).toBe('');
    expect(ebsCoordinatorText('EQUIPO BÁSICO DE SALUD, MUNICIPIO DE OCAÑA', COORDINATORS)).toBe('');
  });

  it('computes the budget execution by report number, and uses the entity fixed duties', async () => {
    const input = await syntheticAccount({ period: 'full' });
    const byValue = await buildTemplateContext(input);
    const ctx = await buildTemplateContext({
      ...input,
      entity: {
        ...input.entity,
        budgetExecution: 'by_count',
        supervisionDuties: ['Uno', 'Dos', 'Tres', 'Cuatro'],
      },
    });
    const expected = Math.floor((input.period.number * 10000) / input.contract.paymentsCount) / 100;
    expect(ctx.budget_execution).toBe(`${String(expected).replace('.', ',')}%`);
    expect(byValue.budget_execution).toBeDefined();
    expect(ctx.contractor_duties.map((d) => d.text)).toEqual(['Uno', 'Dos', 'Tres', 'Cuatro']);
    expect(ctx.contractor_duties[3]!.number).toBe('4');
  });

  it('writes the monthly goals under their obligation in both reports, and the coordinator row only for EBS', async () => {
    const input = await syntheticAccount({ period: 'full' });
    const [first, ...rest] = input.contract.obligations;
    const withGoals = {
      ...input,
      entity: { ...input.entity, ebsCoordinators: COORDINATORS },
      contract: {
        ...input.contract,
        object:
          'MÉDICO GENERAL PARA LA CONFORMACIÓN DEL EQUIPO BÁSICO DE ATENCIÓN No. 004, MUNICIPIO DE ABREGO',
        obligations: [
          { ...first!, goals: [{ label: 'Seguimiento plan de cuidado familiar', target: 80, done: 76 }] },
          ...rest,
        ],
      },
    };
    const ctx = await buildTemplateContext(withGoals);
    const activity = await docxPlainText(await renderDocx(await buildHrnoActivityTemplate(), ctx));
    const supervision = await docxPlainText(await renderDocx(await buildHrnoSupervisionTemplate(), ctx));
    expect(activity).toContain('Cumplimiento de metas del mes:');
    expect(activity).toContain('Seguimiento plan de cuidado familiar: meta 80 · realizadas 76');
    expect(supervision).toContain('Seguimiento plan de cuidado familiar: meta 80 · realizadas 76');
    expect(supervision).toContain('Coordinador (a) EBS');
    expect(supervision).toContain(
      'COORDINADOR UNO, identificado(a) con cédula de ciudadanía número 1.000.000.009 de Cúcuta',
    );
    const plain = await docxPlainText(
      await renderDocx(await buildHrnoSupervisionTemplate(), await buildTemplateContext(input)),
    );
    expect(plain).not.toContain('Coordinador (a) EBS');
  });
});
