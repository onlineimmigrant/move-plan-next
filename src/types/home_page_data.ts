// /app/types/home_page_data.ts
import { HeroData } from './hero_data';
import { Brand } from './brand';
import { FAQ } from './faq';
import { TemplateSection } from './template_section';
import { TemplateHeadingSection } from './template_heading_section';

export interface HomePageData {
  hero: HeroData;
  brands: Brand[];
  faqs: FAQ[];
  templateSections: TemplateSection[];
  templateHeadingSections: TemplateHeadingSection[];
  brands_heading: string;
  labels_default?: {
    button_main_get_started?: { url: string; text: string };
    button_explore?: string;
  };
}