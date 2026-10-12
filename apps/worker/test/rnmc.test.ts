import { describe, expect, it } from 'vitest';
import { describeForm } from '../src/runtime/rnmc-probe.js';

describe('RNMC form probe', () => {
  it('lists the form fields and flags captchas, skipping ASP.NET state', () => {
    const html = `<form id="f"><input type="hidden" name="__VIEWSTATE" value="x">
      <select name="ddlTipoDoc"><option value="55">Cédula de Ciudadanía</option></select>
      <a id="lnk" href="javascript:__doPostBack('ctl00$btnConsultar','')">Consultar</a><input type="text" name="txtNumero">
      <input type="submit" name="btnConsultar" value="Consultar">
      <div class="g-recaptcha" data-sitekey="k"></div></form>`;
    expect(describeForm(html)).toEqual({
      fields: ['ddlTipoDoc:select', 'txtNumero:text', 'btnConsultar:submit'],
      captcha: ['recaptcha', 'captcha'],
      forms: 1,
      postbacks: ['ctl00$btnConsultar'],
      options: ['55=Cédula de Ciudadanía'],
      action: '',
    });
  });
});
