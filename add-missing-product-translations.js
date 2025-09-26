const fs = require('fs');

// Define the missing translations for each language
const translations = {
  de: {
    register: 'Registrieren',
    registerForFreeTrial: 'Für kostenlosen Test registrieren',
    unknown: 'Unbekannt',
    lowStock: 'Wenig Lagerbestand',
    onSale: 'im Angebot',
    percentOff: '% Rabatt',
    selectPlan: 'Plan auswählen',
  },
  ru: {
    register: 'Регистрация',
    registerForFreeTrial: 'Зарегистрироваться для бесплатной пробной версии',
    unknown: 'Неизвестно',
    lowStock: 'Мало на складе',
    onSale: 'в продаже',
    percentOff: '% скидка',
    selectPlan: 'Выбрать план',
  },
  it: {
    register: 'Registrati',
    registerForFreeTrial: 'Registrati per prova gratuita',
    unknown: 'Sconosciuto',
    lowStock: 'Scorte Basse',
    onSale: 'in offerta',
    percentOff: '% di Sconto',
    selectPlan: 'Seleziona piano',
  },
  pt: {
    register: 'Registrar',
    registerForFreeTrial: 'Registrar para teste gratuito',
    unknown: 'Desconhecido',
    lowStock: 'Estoque Baixo',
    onSale: 'em promoção',
    percentOff: '% Desconto',
    selectPlan: 'Selecionar plano',
  },
  pl: {
    register: 'Zarejestruj się',
    registerForFreeTrial: 'Zarejestruj się na bezpłatny okres próbny',
    unknown: 'Nieznany',
    lowStock: 'Mały zapas',
    onSale: 'w sprzedaży',
    percentOff: '% zniżki',
    selectPlan: 'Wybierz plan',
  },
  zh: {
    register: '注册',
    registerForFreeTrial: '注册免费试用',
    unknown: '未知',
    lowStock: '库存不足',
    onSale: '促销中',
    percentOff: '% 折扣',
    selectPlan: '选择计划',
  },
  ja: {
    register: '登録',
    registerForFreeTrial: '無料トライアルに登録',
    unknown: '不明',
    lowStock: '在庫少',
    onSale: 'セール中',
    percentOff: '% オフ',
    selectPlan: 'プランを選択',
  }
};

// Read the current translations file
const filePath = './src/components/product/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// For each language, find the buyOnAmazonAriaLabel line and add the new translations after it
Object.keys(translations).forEach(lang => {
  const langTranslations = translations[lang];
  
  // Create the new translation block
  const newTranslationsBlock = `    buyOnAmazonAriaLabel: '${getBuyOnAmazonAriaLabel(lang)}',
    register: '${langTranslations.register}',
    registerForFreeTrial: '${langTranslations.registerForFreeTrial}',
    
    // Product status
    unknown: '${langTranslations.unknown}',
    lowStock: '${langTranslations.lowStock}',
    onSale: '${langTranslations.onSale}',
    percentOff: '${langTranslations.percentOff}',
    
    // Accessibility labels
    selectPlan: '${langTranslations.selectPlan}',`;

  // Find and replace the buyOnAmazonAriaLabel line for this language
  const buyOnAmazonPattern = new RegExp(`(\\s+buyOnAmazonAriaLabel: '[^']*',)`, 'g');
  
  content = content.replace(buyOnAmazonPattern, (match) => {
    // Check if this match is within the correct language section
    const beforeMatch = content.substring(0, content.indexOf(match));
    const lastLangMatch = beforeMatch.match(new RegExp(`\\s+${lang}: {`, 'g'));
    const nextLangMatch = content.substring(content.indexOf(match)).match(/\s+[a-z]{2}: {/);
    
    // If this is within the current language section and doesn't already have the new translations
    if (lastLangMatch && !content.includes(`${lang}: {`) || 
        (lastLangMatch && (!nextLangMatch || content.indexOf(match) < content.indexOf(nextLangMatch[0])))) {
      if (!content.includes(`register: '${langTranslations.register}'`)) {
        return newTranslationsBlock;
      }
    }
    return match;
  });
});

function getBuyOnAmazonAriaLabel(lang) {
  const labels = {
    de: 'Auf Amazon kaufen',
    ru: 'Купить на Amazon',
    it: 'Acquista su Amazon',
    pt: 'Comprar na Amazon',
    pl: 'Kup na Amazon',
    zh: '在亚马逊购买',
    ja: 'Amazonで購入'
  };
  return labels[lang] || 'Buy on Amazon';
}

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added missing translations for all languages!');
