const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(`<html><body style="font:14px/1.6 Helvetica,Arial;margin:60px 70px;color:#222">
  <p style="text-align:right">Bogotá D. C., 8 de noviembre de 2026</p>
  <h2 style="text-align:center;margin:30px 0 6px">CUENTA DE COBRO No. 006</h2>
  <p style="text-align:center;margin:0 0 30px;color:#555">Contrato de prestación de servicios CPS-0218-2026</p>
  <p><b>EMPRESA EJEMPLO S.A.S.</b><br>NIT 900.000.000-1</p>
  <p style="margin-top:28px">DEBE A:</p>
  <p><b>CARLOS PÉREZ</b><br>C.C. 1.000.000.000</p>
  <p style="margin-top:28px">La suma correspondiente a los honorarios por los servicios profesionales prestados durante el periodo comprendido entre el 1 y el 30 de noviembre de 2026, de acuerdo con el informe de actividades adjunto.</p>
  <p>Declaro que he realizado los aportes al Sistema de Seguridad Social Integral correspondientes al periodo y que los soportes se adjuntan a la presente cuenta de cobro.</p>
  <p style="margin-top:28px">Cordialmente,</p>
  <div style="height:120px"></div>
  <div style="width:260px;border-top:1px solid #333;padding-top:6px"><b>CARLOS PÉREZ</b><br>C.C. 1.000.000.000<br>Contratista</div>
  </body></html>`);
  await p.pdf({ path: 'Cuenta de cobro noviembre.pdf', format: 'Letter' });
  await b.close(); console.log('pdf ok');
})();
