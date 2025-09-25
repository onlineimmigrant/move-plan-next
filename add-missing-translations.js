const fs = require('fs');

// Missing translations for each language
const missingTranslations = {
  de: {
    rating: 'Bewertung',
    comment: 'Kommentar',
    submitAsUser: 'Als Benutzer einreichen',
    submissionDate: 'Einreichungsdatum',
    pleaseSelectUser: 'Bitte wählen Sie einen Benutzer aus, in dessen Namen die Bewertung eingereicht werden soll.',
    pleaseSelectSubmissionDate: 'Bitte wählen Sie ein Einreichungsdatum aus.'
  },
  ru: {
    rating: 'Рейтинг',
    comment: 'Комментарий',
    submitAsUser: 'Отправить от имени пользователя',
    submissionDate: 'Дата отправки',
    pleaseSelectUser: 'Пожалуйста, выберите пользователя, от имени которого отправить отзыв.',
    pleaseSelectSubmissionDate: 'Пожалуйста, выберите дату отправки.'
  },
  it: {
    rating: 'Valutazione',
    comment: 'Commento',
    submitAsUser: 'Invia come utente',
    submissionDate: 'Data di invio',
    pleaseSelectUser: 'Seleziona un utente a nome del quale inviare la recensione.',
    pleaseSelectSubmissionDate: 'Seleziona una data di invio.'
  },
  pt: {
    rating: 'Avaliação',
    comment: 'Comentário',
    submitAsUser: 'Enviar como usuário',
    submissionDate: 'Data de submissão',
    pleaseSelectUser: 'Por favor, selecione um usuário em nome do qual enviar a avaliação.',
    pleaseSelectSubmissionDate: 'Por favor, selecione uma data de submissão.'
  },
  pl: {
    rating: 'Ocena',
    comment: 'Komentarz',
    submitAsUser: 'Prześlij jako użytkownik',
    submissionDate: 'Data przesłania',
    pleaseSelectUser: 'Proszę wybrać użytkownika, w imieniu którego przesłać opinię.',
    pleaseSelectSubmissionDate: 'Proszę wybrać datę przesłania.'
  },
  zh: {
    rating: '评分',
    comment: '评论',
    submitAsUser: '以用户身份提交',
    submissionDate: '提交日期',
    pleaseSelectUser: '请选择一个用户代表其提交评论。',
    pleaseSelectSubmissionDate: '请选择提交日期。'
  },
  ja: {
    rating: '評価',
    comment: 'コメント',
    submitAsUser: 'ユーザーとして送信',
    submissionDate: '提出日',
    pleaseSelectUser: 'レビューを代理で送信するユーザーを選択してください。',
    pleaseSelectSubmissionDate: '提出日を選択してください。'
  }
};

const filePath = '/Users/ois/move-plan-next/src/components/FeedbackAccordion/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// For each language, add the missing translations
Object.keys(missingTranslations).forEach(lang => {
  const translations = missingTranslations[lang];
  
  // Find the form fields section for this language
  const formFieldsPattern = new RegExp(`(${lang}:[\\s\\S]*?// Form fields[\\s\\S]*?writeFeedbackPlaceholder: '[^']*',)`, 'g');
  
  content = content.replace(formFieldsPattern, (match) => {
    return match + `
    rating: '${translations.rating}',
    comment: '${translations.comment}',
    submitAsUser: '${translations.submitAsUser}',
    submissionDate: '${translations.submissionDate}',`;
  });
  
  // Find the validation messages section for this language
  const validationPattern = new RegExp(`(${lang}:[\\s\\S]*?// Validation messages[\\s\\S]*?commentRequired: '[^']*',)`, 'g');
  
  content = content.replace(validationPattern, (match) => {
    return match + `
    pleaseSelectUser: '${translations.pleaseSelectUser}',
    pleaseSelectSubmissionDate: '${translations.pleaseSelectSubmissionDate}',`;
  });
});

fs.writeFileSync(filePath, content);
console.log('Missing translations added successfully!');
