// lib/sidebarLinks.ts
export interface LinkItem {
    href?: string;
    label: string;
    children?: LinkItem[];
    isOpen?: boolean;
  }
  
  export type DisclosureKey = "users" | "sell" | "app" | "booking" | "consent_management" | "blog" | "feedback" | "edupro" | "quiz" | "ai" | 
  "datacollection" | "website" | "email" | "settings";
  
  export const sidebarLinks: Record<DisclosureKey, LinkItem[]> = {
    users: [
      { href: "/admin/profiles", label: "Profiles" },
      { href: "/admin/roles", label: "Roles" },
    ],
    sell: [
      {
        label: "Products",
        children: [
          { href: "/admin/products", label: "Products" },
          { href: "/admin/product_types", label: "Product Types" },
          { href: "/admin/product_sub_types", label: "Product Sub Types" },
        ],
      },
      


      {
        label: "Price",
        children: [
          { href: "/admin/pricingplans", label: "Pricing Plans" },
          { href: "/admin/pricing_comparison_table", label: "Pricing Comparison" },
          { href: "/admin/features", label: "Features" },
          { href: "/admin/pricingplan_features", label: "Pricing Features" },
          { href: "/admin/inventory", label: "Inventory" },
        ],
      },
      {
        label: "Stripe",
        children: [
          { href: "/admin/customers", label: "Customers" },
          { href: "/admin/transactions", label: "Transactions" },
          { href: "/admin/subscriptions", label: "Subscriptions" },
          { href: "/admin/stripe_products", label: "Stripe Products" },
          { href: "/admin/stripe_prices", label: "Stripe Prices" },
        ],
      },
      {
        label: "General",
        children: [{ href: "/admin/faq", label: "FAQ" }],
      },
    ],

    booking: [
    
       
        { href: "/admin/booking_booking", label: "Booking" },
        { href: "/admin/booking_bookingorder", label: "Orders" },
        { href: "/admin/booking_temporaryorder", label: "Temporary Orders" },
        { href: "/admin/booking_userpurchase", label: "Purchases" },
     
     
  
  ],



    app: [
      {
        label: "General",
        children: [
          { href: "/admin/countries", label: "Countries" },
          { href: "/admin/currencies", label: "Currencies" },
          { href: "/admin/todo", label: "ToDo" },
          { href: "/admin/pack_types", label: "Pack Types" },
          { href: "/admin/item_types", label: "Item Types" },
        ],
      },
      {
        label: "Users",
        children: [
          { href: "/admin/relocation_plans", label: "Relocation Plans" },
          { href: "/admin/user_todo", label: "User ToDo" },
          { href: "/admin/packing", label: "Packing" },
          { href: "/admin/sale_items", label: "Sale Items" },
          { href: "/admin/costs", label: "Costs" },
          { href: "/admin/travel_costs", label: "Travel Costs" },
          { href: "/admin/legal_docs_costs", label: "Legal Docs Costs" },
          { href: "/admin/insurance_costs", label: "Insurance Costs" },
          { href: "/admin/pet_relocation_costs", label: "Pet Relocation Costs" },
          { href: "/admin/user_docs", label: "User Docs" },
        ],
      },
    ],



    consent_management: [
      {
        label: "Cookie Consent",
        children: [
          { href: "/admin/cookie_consent", label: "Consent:Users" },
          {
            label: "Logs",
            children: [
              { href: "/admin/cookie_consent_logs", label: "Logs" },
              { href: "/admin/cookie_consent_log_services_accepted", label: "Logs: accepted" },
              { href: "/admin/cookie_consent_log_services_rejected", label: "Logs: rejected" },
            ],
          },
          { href: "/admin/cookie_consent_services", label: "Consent Services" },
          { href: "/admin/cookie_consent_devices", label: "Consent Devices" },
          { href: "/admin/consent_device_info", label: "Devices Info" },
          { href: "/admin/cookie_consent_geolocations", label: "Consent Geolocation" },
          { href: "/admin/consent_geolocation", label: "Geolocations" },
        ],
      },
      {
        label: "Cookie: general",
        children: [
          { href: "/admin/cookie_category", label: "Category" },
          { href: "/admin/cookie_service_stored_information", label: "Stored Information" },
          { href: "/admin/cookie_service_technology_used", label: "Technology Used" },
        ],
      },
      {
        label: "Cookie Service",
        children: [
          { href: "/admin/cookie_service", label: "Services" },
          { href: "/admin/cookie_service_legal_basis", label: "Legal Basis" },
          { href: "/admin/cookie_service_location_of_processing", label: "Location of Processing" },
          { href: "/admin/cookie_service_third_country_transfer", label: "Third Country Transfer" },
        ],
      },
      {
        label: "Data",
        children: [
          { href: "/admin/cookie_service_data_collected", label: "Types Collected" },
          { href: "/admin/cookie_service_data_purpose", label: "Purpose" },
          { href: "/admin/cookie_service_data_recepient", label: "Recepient" },
        ],
      },
    ],

    blog: [
     
       
            { href: "/admin/blog_post", label: "Posts" },
            { href: "/admin/blog_ctacard", label: "Cards" },
            { href: "/admin/blog_post_faq_section", label: "Posts & FAQ" },
         
         
      
      ],

      feedback: [
     
       
        { href: "/admin/feedback_feedbackposts", label: "Feedback Posts" },
        { href: "/admin/feedback_feedbackproducts", label: "Feedback Products" },
      
     
     
  
  ],
      edupro: [
        {
          label: "Content",
          children: [
            { href: "/admin/edu_pro_course", label: "Courses" },
            { href: "/admin/edu_pro_studyprogram", label: "Study Programs" },
            { href: "/admin/edu_pro_topic", label: "Topics" },
            { href: "/admin/edu_pro_lesson", label: "Lessons" },
            { href: "/admin/edu_pro_resource", label: "Resources" },
            { href: "/admin/edu_pro_studyprovider", label: "Study Provider" },
            { href: "/admin/edu_pro_course_prerequisites", label: "Course Prerequisites" },
            { href: "/admin/edu_pro_course_related_courses", label: "Related Courses" },
            { href: "/admin/edu_pro_course_similar_courses", label: "Similar Courses" },
            { href: "/admin/edu_pro_course_tags", label: "Course Tags" },
            { href: "/admin/edu_pro_coursetopic", label: "Course Topics" },
            { href: "/admin/edu_pro_dayofweek", label: "Day of Weeks" },
            { href: "/admin/edu_pro_lesson_resources", label: "Lesson Resources" },
            { href: "/admin/edu_pro_resource_quiz_sections", label: "Resource Quiz Sections" },
            { href: "/admin/edu_pro_resource_quiz_topics", label: "Resource Quiz Topics" },
            { href: "/admin/edu_pro_tag", label: "Tags" },
            { href: "/admin/edu_pro_topic_prerequisite_topics", label: "Prerequisite Topics" },
            { href: "/admin/edu_pro_topic_resources", label: "Topic Resources" },
            { href: "/admin/edu_pro_topicsconnection", label: "Topic Connections" },
          ],
        },
        {
            label: "Classes",
            children: [
              { href: "/admin/edu_pro_classgroup", label: "Groupes" },
              { href: "/admin/edu_pro_classgroup_teachers", label: "Group Teachers" },
              { href: "/admin/edu_pro_teacher", label: "Teachers" },
              { href: "/admin/edu_pro_teacher_specialties", label: "Teacher Specialties" },
       
            ],
          },
        {
            label: "Users",
            children: [
              { href: "/admin/edu_pro_student", label: "Students" },
              { href: "/admin/edu_pro_enrollment", label: "Enrollment" },
              { href: "/admin/edu_pro_progress", label: "Progress" },
              { href: "/admin/edu_pro_lessonprogress", label: "Lesson Progress" },
              { href: "/admin/edu_pro_userlessonplanpreference", label: "Lesson Pref" },
              { href: "/admin/edu_pro_userlessonplanpreference_skipped_days", label: "Lesson Pref Skipped" },
              
              { href: "/admin/edu_pro_assessment", label: "Assessment" },
              { href: "/admin/edu_pro_assessmentresult", label: "Assessment Result" },
              { href: "/admin/edu_pro_certificate", label: "Certificate" },
              { href: "/admin/edu_pro_feedback", label: "Feedback" },
              { href: "/admin/edu_pro_usernote", label: "Notes" },
            ],
          },
      ],

      quiz: [
        {
            label: "General",
            children: [
     
        { href: "/admin/quiz_quizcommon", label: "Quizzes" },
        { href: "/admin/quiz_topic", label: "Topics" },
        { href: "/admin/quiz_section", label: "Sections" },
        { href: "/admin/quiz_question", label: "Questions" },
        { href: "/admin/quiz_choice", label: "Choices" },
        { href: "/admin/quiz_question_quiz", label: "Question - Quiz" },
        { href: "/admin/quiz_topic_quiz", label: "Topic - Quiz" },
            
        ],
        },

        {
            label: "Users",
            children: [
     
        { href: "/admin/quiz_quizstatistic", label: "Quiz Statistic" },
        { href: "/admin/quiz_quizstatistic_topics", label: "Topic Statistic" },
        { href: "/admin/quiz_useranswer", label: "User Answers" },
        { href: "/admin/quiz_useranswer_choices", label: "User Answers Choices" },
  
            
        ],
        },

    ],

    ai: [
     
       
        { href: "/admin/ai_integration_aimodel", label: "Model" },
        { href: "/admin/ai_integration_conversationsession", label: "Conversation Session" },
        { href: "/admin/ai_integration_message", label: "AI Message" },
        { href: "/admin/ai_integration_predefinedmodelname", label: "Predefined Model Name" },
        { href: "/admin/ai_integration_uploadedfile", label: "Upload File" },
      
     
     
  
  ],

  datacollection: [
    
       
    { href: "/admin/collect_data_datacollection", label: "Data Collection" },

 
 

],



website: [
    { href: "/admin/website_templatesection", label: "Template Sections" },
    { href: "/admin/website_templatesection_metrics", label: "Template Sections Metrics" },
    { href: "/admin/website_metric", label: "Template Metrics" },
    { href: "/admin/website_templatesectionheading", label: "Template Heading Sections" },
    { href: "/admin/website_hero", label: "Hero" },
    { href: "/admin/website_banner", label: "Banners" },
    { href: "/admin/website_block", label: "Block" },
    { href: "/admin/website_body", label: "Body" },
    { href: "/admin/website_footer", label: "Footer" },
    { href: "/admin/website_carouselimage", label: "Carousel Image" },
    { href: "/admin/website_companyprofile", label: "Company Profile" },
    { href: "/admin/website_companyprofile_available_languages", label: "Company Profile Languages" },
    { href: "/admin/website_dashboard", label: "Dashboard" },
    { href: "/admin/website_emailstyle", label: "Email Style" },
    { href: "/admin/website_menuitem", label: "Menu Items" },
    { href: "/admin/website_submenuitem", label: "Sub Menu Items" },
    { href: "/admin/website_homepage", label: "Home Page" },
    { href: "/admin/website_homepage_brands_choices", label: "Home Page Brands" },
 
 

],

email: [    
    { href: "/admin/email_app_automatedemails", label: "Automated Emails" },
    { href: "/admin/email_app_email", label: "App Emails" },
    { href: "/admin/email_app_sentemail", label: "Sent Emails" },

],

    settings: [
      {
        label: "General",
        children: [
          { href: "/admin/settings", label: "Settings" },
          { href: "/admin/color", label: "Color" },
          { href: "/admin/font", label: "Font" },
          { href: "/admin/size", label: "Sizes" },
        ],
      },
      {
        label: "Site Management",
        children: [
          { href: "/admin/site-management/management", label: "Site Management" },
        ],
      },
    ],
  };
  
  // Function to generate table-to-disclosure mapping dynamically
  export const getTableToDisclosure = (): { [key: string]: string } => {
    const mapping: { [key: string]: string } = {};
    Object.entries(sidebarLinks).forEach(([section, items]) => {
      const processItems = (items: LinkItem[]) => {
        items.forEach((item) => {
          if (item.href) {
            const tableName = item.href.split("/admin/")[1];
            if (tableName) {
              mapping[tableName] = section;
            }
          }
          if (item.children) {
            processItems(item.children);
          }
        });
      };
      processItems(items);
    });
    return mapping;
  };

// Function to filter sidebar links based on user permissions
export const getFilteredSidebarLinks = (
  sidebarLinks: Record<DisclosureKey, LinkItem[]>, 
  isInGeneralOrganization: boolean
): Record<DisclosureKey, LinkItem[]> => {
  if (isInGeneralOrganization) {
    return sidebarLinks; // Show all links including site management
  }
  
  // Filter out site management for non-general organization users
  const filteredLinks = { ...sidebarLinks };
  if (filteredLinks.settings) {
    filteredLinks.settings = sidebarLinks.settings.filter(section => 
      section.label !== 'Site Management'
    );
  }
  
  return filteredLinks;
};