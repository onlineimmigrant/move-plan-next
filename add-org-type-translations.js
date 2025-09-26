const fs = require('fs');

// Define the organization type translations for each language
const orgTypeTranslations = {
  fr: {
    immigrationServices: 'Services d\'Immigration',
    legalServices: 'Services Juridiques',
    financialServices: 'Services Financiers',
    coursesEducation: 'Cours et Éducation',
    jobOpportunities: 'Opportunités d\'Emploi',
    beautyServices: 'Services de Beauté',
    medicalServices: 'Services Médicaux',
    ourServices: 'Nos Services',
    realEstate: 'Immobilier',
  },
  de: {
    immigrationServices: 'Einwanderungsdienstleistungen',
    legalServices: 'Rechtsdienstleistungen',
    financialServices: 'Finanzdienstleistungen',
    coursesEducation: 'Kurse & Bildung',
    jobOpportunities: 'Stellenangebote',
    beautyServices: 'Schönheitsdienstleistungen',
    medicalServices: 'Medizinische Dienstleistungen',
    ourServices: 'Unsere Dienstleistungen',
    realEstate: 'Immobilien',
  },
  ru: {
    immigrationServices: 'Иммиграционные Услуги',
    legalServices: 'Юридические Услуги',
    financialServices: 'Финансовые Услуги',
    coursesEducation: 'Курсы и Образование',
    jobOpportunities: 'Вакансии',
    beautyServices: 'Услуги Красоты',
    medicalServices: 'Медицинские Услуги',
    ourServices: 'Наши Услуги',
    realEstate: 'Недвижимость',
  },
  it: {
    immigrationServices: 'Servizi di Immigrazione',
    legalServices: 'Servizi Legali',
    financialServices: 'Servizi Finanziari',
    coursesEducation: 'Corsi e Formazione',
    jobOpportunities: 'Opportunità di Lavoro',
    beautyServices: 'Servizi di Bellezza',
    medicalServices: 'Servizi Medici',
    ourServices: 'I Nostri Servizi',
    realEstate: 'Immobiliare',
  },
  pt: {
    immigrationServices: 'Serviços de Imigração',
    legalServices: 'Serviços Jurídicos',
    financialServices: 'Serviços Financeiros',
    coursesEducation: 'Cursos e Educação',
    jobOpportunities: 'Oportunidades de Emprego',
    beautyServices: 'Serviços de Beleza',
    medicalServices: 'Serviços Médicos',
    ourServices: 'Nossos Serviços',
    realEstate: 'Imobiliário',
  },
  pl: {
    immigrationServices: 'Usługi Imigracyjne',
    legalServices: 'Usługi Prawne',
    financialServices: 'Usługi Finansowe',
    coursesEducation: 'Kursy i Edukacja',
    jobOpportunities: 'Możliwości Pracy',
    beautyServices: 'Usługi Kosmetyczne',
    medicalServices: 'Usługi Medyczne',
    ourServices: 'Nasze Usługi',
    realEstate: 'Nieruchomości',
  },
  zh: {
    immigrationServices: '移民服务',
    legalServices: '法律服务',
    financialServices: '金融服务',
    coursesEducation: '课程与教育',
    jobOpportunities: '工作机会',
    beautyServices: '美容服务',
    medicalServices: '医疗服务',
    ourServices: '我们的服务',
    realEstate: '房地产',
  },
  ja: {
    immigrationServices: '入国管理サービス',
    legalServices: '法的サービス',
    financialServices: '金融サービス',
    coursesEducation: 'コースと教育',
    jobOpportunities: '求人情報',
    beautyServices: '美容サービス',
    medicalServices: '医療サービス',
    ourServices: '私たちのサービス',
    realEstate: '不動産',
  }
};

// Read the current translations file
const filePath = './src/components/product/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// For each language, add the organization type translations
Object.keys(orgTypeTranslations).forEach(lang => {
  const langTranslations = orgTypeTranslations[lang];
  
  // Create the new translation block
  const newTranslationsBlock = `    // Organization type based page titles
    immigrationServices: '${langTranslations.immigrationServices}',
    legalServices: '${langTranslations.legalServices}',
    financialServices: '${langTranslations.financialServices}',
    coursesEducation: '${langTranslations.coursesEducation}',
    jobOpportunities: '${langTranslations.jobOpportunities}',
    beautyServices: '${langTranslations.beautyServices}',
    medicalServices: '${langTranslations.medicalServices}',
    ourServices: '${langTranslations.ourServices}',
    realEstate: '${langTranslations.realEstate}',
    
    //`;

  // Find the pattern: selectPlan: '...', followed by whitespace and a comment or next section
  const selectPlanPattern = new RegExp(`(\\s+selectPlan: '[^']*',\\s*\\n\\s*)(// |\\w)`, 'g');
  
  let match;
  while ((match = selectPlanPattern.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const afterMatch = content.substring(match.index + match[0].length);
    
    // Check if this is within the correct language section by looking backwards for the language declaration
    const langPattern = new RegExp(`\\s+${lang}: {[^}]*$`, 'm');
    const reversedBefore = beforeMatch.split('').reverse().join('');
    const nextLangPattern = /\s+[a-z]{2}: {/;
    
    // Simple check: if we find the lang pattern in the last 2000 characters, it's probably the right section
    const recentContent = beforeMatch.slice(-2000);
    if (recentContent.includes(`${lang}: {`) && !afterMatch.slice(0, 500).includes('immigrationServices:')) {
      const replacement = match[1] + newTranslationsBlock + match[2];
      content = beforeMatch + replacement + afterMatch;
      break;
    }
  }
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added organization type translations for all languages!');
