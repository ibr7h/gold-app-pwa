import {describe,it,expect} from 'vitest';
import {LANGUAGE_META,LANGUAGE_OPTIONS,LANGUAGE_KEY,translateUiText,translateExact,translationCount} from '../i18n-messages';
import {amountToLocalizedWords} from '../amount-words-localized';

describe('Dhahabi offline three-language localization',()=>{
 it('supports reversible language selection and correct display direction',()=>{
  expect(LANGUAGE_OPTIONS).toEqual(['ar','en','fr']);
  expect(LANGUAGE_META.ar.dir).toBe('rtl');
  expect(LANGUAGE_META.en.dir).toBe('ltr');
  expect(LANGUAGE_META.fr.dir).toBe('ltr');
  expect(LANGUAGE_META.fr.intl).toBe('fr-FR');
  expect(LANGUAGE_KEY).toBe('dhahabi:user:language');
  expect(translationCount()).toBeGreaterThan(260);
 });
 it('translates navigation and key gold financial labels into both languages',()=>{
  expect(translateUiText('الحاسبة','en')).toBe('Calculator');
  expect(translateUiText('الحاسبة','fr')).toBe('Calculatrice');
  expect(translateUiText('لغة التطبيق','en')).toBe('App language');
  expect(translateUiText('لغة التطبيق','fr')).toBe("Langue de l'application");
  expect(translateUiText('تفاصيل السعر المقدر','en')).toBe('Estimated price breakdown');
  expect(translateUiText('تفاصيل السعر المقدر','fr')).toBe('Détail du prix estimé');
  expect(translateUiText('إعدادات الإشعارات','en')).toBe('Notification settings');
  expect(translateUiText('إعدادات الإشعارات','fr')).toBe('Paramètres des notifications');
 });
 it('does not translate unknown data, mobile numbers or user-entered portfolio names',()=>{
  expect(translateUiText('ذهب الأطفال في جازان','fr')).toBe('ذهب الأطفال في جازان');
  expect(translateUiText('0501234567','fr')).toBe('0501234567');
  expect(translateUiText('المحفظة','ar')).toBe('المحفظة');
  expect(translateExact('unk','en')).toBeNull();
 });
 it('translates Arabic-backed dynamic weight and purity labels without altering numeric values',()=>{
  expect(translateUiText('عيار 24','en')).toBe('Karat 24');
  expect(translateUiText('عيار 21','fr')).toBe('Carats 21');
  expect(translateUiText('  10 جرام  ','fr')).toBe('  10 grammes  ');
 });
 it('spells USD and SAR amounts in the selected language, not always as riyals',()=>{
  expect(amountToLocalizedWords(123.45,'USD','en')).toBe('Only one hundred twenty-three US dollars and forty-five cents.');
  expect(amountToLocalizedWords(1,'USD','en')).toBe('Only one US dollar.');
  expect(amountToLocalizedWords(71.8,'SAR','fr')).toBe('Seulement soixante et onze riyals saoudiens et quatre-vingts halalas.');
  expect(amountToLocalizedWords(21,'USD','fr')).toBe('Seulement vingt et un dollars américains.');
  expect(amountToLocalizedWords(12.3,'USD','ar')).toContain('دولار أمريكي');
  expect(amountToLocalizedWords(12.3,'SAR','ar')).toContain('ريال');
 });
 it('preserves total values, two-decimal words and rejects invalid amounts',()=>{
  expect(amountToLocalizedWords(0,'USD','en')).toBe('Only zero US dollars.');
  expect(amountToLocalizedWords(0,'USD','fr')).toBe('Seulement zéro dollar américain.');
  expect(amountToLocalizedWords(null,'USD','en')).toBe('');
  expect(amountToLocalizedWords(-1,'SAR','fr')).toBe('');
  expect(amountToLocalizedWords(Number.NaN,'USD','en')).toBe('');
 });
});
