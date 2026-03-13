// ===========================================
// DAJANA AI - Internationalization (i18n)
// ===========================================
// Primarni: Srpski (sr)
// Sekundarni: English (en)

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

// Translations
const translations = {
  sr: {
    // Common
    app_name: 'DAJANA AI',
    loading: 'Učitavanje...',
    error: 'Greška',
    success: 'Uspešno',
    cancel: 'Otkaži',
    save: 'Sačuvaj',
    delete: 'Obriši',
    edit: 'Izmeni',
    back: 'Nazad',
    next: 'Dalje',
    done: 'Gotovo',
    yes: 'Da',
    no: 'Ne',
    ok: 'OK',

    // Auth
    auth: {
      // Welcome Screen
      your_personal_stylist: 'Tvoj lični stilista',
      your_personal_ai_stylist: 'Tvoj lični AI stilista',
      get_started: 'Započni',
      welcome_headline: 'Unapredi svoj stil sa Dajanom',
      welcome_desc: 'Personalizovane preporuke, kapsula garderobe i AI saveti prilagođeni tebi.',
      swipe_to_start: 'Prevuci da počneš',
      skip: 'Preskoči',
      next: 'Nastavi',
      
      // Slide 1
      slide1_title: 'Otkrij svoj stil',
      slide1_subtitle: 'Tvoj lični stilista',
      slide1_desc: 'Otkrij kombinacije koje ističu tvoju prirodnu lepotu i vraćaju žensku energiju',
      
      // Slide 2
      slide2_title: 'Personalizovano za tebe',
      slide2_subtitle: 'Tvoja analiza, tvoj stil',
      slide2_desc: 'Na osnovu tvoje analize boja i građe dobij savršene preporuke za garderobu',
      
      // Slide 3
      slide3_title: 'Saveti od Dajane',
      slide3_subtitle: 'Ekspertiza na dlanu',
      slide3_desc: 'Jasna, jednostavna i personalizovana modna rešenja koja podižu samopouzdanje',
      
      welcome_back: 'Dobrodošli nazad',
      sign_in_subtitle: 'Prijavite se na svoj nalog',
      create_account: 'Kreirajte nalog',
      sign_up_subtitle: 'Započnite svoje stilsko putovanje',
      email: 'Email',
      email_placeholder: 'vas@email.com',
      password: 'Lozinka',
      password_placeholder: '••••••••',
      confirm_password: 'Potvrdite lozinku',
      confirm_password_placeholder: 'Ponovite lozinku',
      full_name: 'Ime i prezime',
      full_name_placeholder: 'Marija Petrović',
      sign_in: 'Prijavi se',
      sign_up: 'Registruj se',
      sign_out: 'Odjavi se',
      forgot_password: 'Zaboravili ste lozinku?',
      no_account: 'Nemate nalog?',
      have_account: 'Već imate nalog?',
      continue_as_guest: 'Nastavi kao gost',
      register: 'Registrujte se',
      login: 'Prijavite se',
      reset_password: 'Resetuj lozinku',
      reset_password_title: 'Zaboravljena lozinka?',
      reset_password_subtitle: 'Unesite email adresu i poslaćemo vam link za resetovanje lozinke',
      send_link: 'Pošalji link',
      check_email: 'Proverite email',
      email_sent: 'Poslali smo link za resetovanje lozinke na',
      back_to_login: 'Nazad na prijavu',
      remember_password: 'Setili ste se lozinke?',
      min_password: 'Najmanje 6 karaktera',

      // Errors
      error_invalid_credentials: 'Pogrešan email ili lozinka',
      error_email_not_confirmed: 'Molimo potvrdite email adresu',
      error_email_exists: 'Email adresa je već registrovana',
      error_generic: 'Došlo je do greške',
      error_fill_all_fields: 'Popunite sva polja',
      error_password_mismatch: 'Lozinke se ne poklapaju',
      error_password_too_short: 'Lozinka mora imati najmanje 6 karaktera',
      error_enter_email: 'Unesite email adresu',
      error_enter_email_password: 'Unesite email i lozinku',

      // Success
      success_registered: 'Uspešna registracija!',
      success_check_email: 'Proverite email za potvrdu naloga.',
      account_exists: 'Nalog već postoji',
      account_exists_message: 'Korisnik sa ovom email adresom već postoji. Pokušajte se prijaviti.',
    },

    // Tabs
    tabs: {
      home: 'Početna',
      capsule: 'Kapsula',
      videos: 'Videi',
      ai_advice: 'AI Savet',
      profile: 'Profil',
    },

    // Home
    home: {
      hero_tagline: 'Tvoj lični AI stilista',
      segment_outfit: 'OUTFIT',
      segment_video: 'VIDEO',
      segment_image: 'SLIKA',
      empty_swipe: 'Swipe i započni kreiranje',
      good_morning: 'Dobro jutro',
      good_afternoon: 'Dobar dan',
      good_evening: 'Dobro veče',
      credits_title: 'Vaši krediti (obnova na 31 dana)',
      credits_hero_subtitle: 'Koristite slike, video i analize da unapredite svoj stil sa Dajanom.',
      images: 'Slika',
      videos: 'Videa',
      analyses: 'Analiza',
      bonus: 'bonus',
      quick_actions: 'Brze akcije',
      try_outfit: 'Probaj outfit',
      make_video: 'Napravi video',
      ask_dajana: 'Pitaj Dajanu',
      complete_profile: 'Završite svoj profil',
      complete_profile_desc: 'Unesite mere da bismo vam prikazali personalizovane kombinacije',
      outfit_choice_title: 'Odakle gledaš outfite?',
      outfit_choose: 'Izaberi',
      outfit_from_capsule: 'Iz Kapsule',
      outfit_capsule_short: 'Kapsula',
      outfit_from_capsule_desc: 'Outfiti koje si ručno složila',
      outfit_from_ormar: 'Ormar',
      outfit_ormar_short: 'Ormar',
      outfit_from_ormar_desc: 'Outfiti generisani od Dajane',
      outfit_back_choice: 'Nazad na izbor',
      outfit_ormar_empty: 'Ovde su cele slike koje je Dajana generisala. Probaj Try-on da dobiješ prvu.',
      delete_outfit_title: 'Obriši outfit',
      delete_outfit_message: 'Da li ste sigurni da želite da obrišete ovaj outfit?',
      delete_image_title: 'Obriši sliku',
      delete_image_message: 'Da li ste sigurni da želite da obrišete ovu generisanu sliku?',
      delete_video_title: 'Obriši video',
      delete_video_message: 'Da li ste sigurni da želite da obrišete ovaj video?',
    },

    // Profile
    profile: {
      my_data: 'Moji podaci',
      body_type: 'Tip građe',
      season: 'Sezona',
      height: 'Visina',
      weight: 'Težina',
      measurements: 'Mere',
      bust: 'Grudi',
      waist: 'Struk',
      hips: 'Kukovi',
      edit_data: 'Izmeni podatke',
      edit_link: 'Uredi',
      credits: 'Krediti',
      buy_more: 'Kupi dodatne kredite',
      theme: 'Tema',
      theme_light: 'Svetla',
      theme_dark: 'Tamna',
      language: 'Jezik',
      notifications: 'Notifikacije',
      help: 'Pomoć',
      privacy_policy: 'Politika privatnosti',
      sign_out: 'Odjavi se',
      sign_out_confirm: 'Da li ste sigurni da želite da se odjavite?',
      delete_account: 'Obriši nalog',
      delete_account_confirm: 'Da li ste sigurni? Nalog će biti trajno obrisan sa svim podacima. Ovu radnju nije moguće poništiti.',
      delete_account_success: 'Nalog je obrisan.',
      not_set: 'Nije uneto',
      saved_menu: 'Sačuvano',
      saved_screen_title: 'Sačuvano',
    },
    guest_modal: {
      title: 'Napravite profil',
      message: 'Ovaj sadržaj mogu da koriste samo prijavljeni korisnici. Prijavi se ili se registruj da nastaviš.',
      sign_in: 'Prijavi se',
      register: 'Registruj se',
    },

    // Shop (Pretplata i doplata)
    shop: {
      title: 'Pretplata i krediti',
      subtitle: 'Mesečna ili godišnja pretplata obuhvata kredite za slike, videe i AI analize. Doplata za prekoračenje.',
      section_subscription: 'Pretplata',
      plan_monthly: 'Mesečna',
      plan_monthly_desc: '50 slika, 2 videa, 2 AI analize – obnova svakih 31 dan.',
      plan_yearly: 'Godišnja',
      plan_yearly_desc: 'Isti paket kredita, plaćanje jednom godišnje sa popustom.',
      section_topup: 'Doplata za prekoračenje',
      topup_name: 'Paket kredita',
      topup_desc: '+10 slika (kapsula), +1 video, +2 AI analize.',
      popular: 'Popularno',
      images: 'Slike',
      videos: 'Videa',
      analyses: 'Analize',
      buy: 'Kupi',
      subscribe: 'Pretplati se',
      buy_confirm_title: 'Kupovina',
      coming_soon_message: 'Plaćanje za %{price} će uskoro biti dostupno. Hvala na interesovanju!',
      payment_method: 'Plaćanje: Stripe (kartice, Apple Pay, Google Pay).',
      footer_note: 'Kad istekne pretplata, i dalje možete pregledati sačuvane slike, videe i savete; novo generisanje zahteva obnovu ili dopunu.',
      no_subscription_no_credits: 'Nemate aktivnu pretplatu niti kredite za generisanje. Obnovite pretplatu ili kupite dopunu u Shopu.',
    },

    no_credits_modal: {
      title_image: 'Nema kredita za slike',
      title_video: 'Nema kredita za video',
      message: 'Obnovite pretplatu ili kupite dopunu u Shopu da biste nastavili sa generisanjem.',
      later: 'Kasnije',
      go_to_shop: 'Obnovi pretplatu',
    },

    // Payment (simulacija / Stripe)
    payment: {
      title: 'Plaćanje',
      order_summary: 'Pregled',
      card_number: 'Broj kartice',
      card_placeholder: '4242 4242 4242 4242',
      expiry: 'Ističe',
      expiry_placeholder: 'MM/GG',
      cvc: 'CVC',
      cvc_placeholder: '123',
      pay_btn: 'Plaćaj %{amount}',
      processing: 'Obrada...',
      success_title: 'Plaćanje uspešno',
      success_message: 'Hvala vam. Vaša kupovina je zabeležena.',
      back_to_shop: 'Nazad u Shop',
      secure_note: 'Sigurno plaćanje putem Stripe. Ovo je simulacija – nema stvarne naplate.',
    },

    // Edit Profile
    edit_profile: {
      title: 'Izmeni profil',
      personal_data: 'Lični podaci',
      full_name: 'Ime i prezime',
      full_name_placeholder: 'Unesite ime',
      measurements: 'Mere',
      height: 'Visina',
      weight: 'Težina',
      bust: 'Obim grudi',
      waist: 'Obim struka',
      hips: 'Obim kukova',
      color_season: 'Sezona boja',
      color_season_subtitle: 'Izaberite sezonu boja koja vam najbolje odgovara',
      save_changes: 'Sačuvaj izmene',
      saving: 'Čuvanje...',
      success: 'Uspešno',
      profile_updated: 'Profil je ažuriran',
      error_height: 'Visina mora biti između 100 i 250 cm',
      error_measurements: 'Molimo proverite unete mere',
      error_save: 'Došlo je do greške prilikom čuvanja',
    },

    // Onboarding
    onboarding: {
      step_of: 'Korak %{current} od %{total}',
      // Screen 1 - Measurements
      your_measurements: 'Vaše mere',
      measurements_subtitle: 'Unesite svoje mere kako bismo izračunali vaš tip građe i prilagodili preporuke',
      height: 'Visina',
      weight: 'Težina',
      weight_optional: 'Težina (opciono)',
      bust: 'Obim grudi',
      waist: 'Obim struka',
      hips: 'Obim kukova',
      required: '*',
      bust_hint: 'Merite preko najšireg dela grudi',
      waist_hint: 'Merite na najužem delu struka',
      hips_hint: 'Merite preko najšireg dela kukova',
      continue: 'Nastavi',
      saving: 'Sačuvavanje...',
      error_required: 'Molimo unesite sve obavezne mere (visina, grudi, struk, kukovi)',
      error_height: 'Visina mora biti između 100 i 250 cm',
      error_check_measurements: 'Molimo proverite unete mere',
      error_save: 'Došlo je do greške prilikom čuvanja podataka',
      // Screen 2 - Body Type
      your_body_type: 'Vaš tip građe',
      body_type_subtitle: 'Na osnovu vaših mera, izračunali smo vaš tip građe',
      body_type_info: 'Koristićemo ove informacije da vam prikažemo outfite koji najbolje odgovaraju vašem tipu građe',
      // Screen 3 - Analysis Question
      analysis_question: 'Da li ste radili analizu?',
      analysis_subtitle: 'Da li ste radili profesionalnu analizu boja kod Dajane?',
      analysis_info: 'Ako ste radili analizu kod Dajane, znate svoju sezonu boja i možete dobiti personalizovane preporuke za garderobu.',
      yes_did_analysis: 'Da, radila sam analizu',
      no_skip_analysis: 'Ne, nisam još',
      upsell_title: 'Želite personalizovane boje?',
      upsell_text: 'Zakažite analizu kod Dajane i otkrijte svoju sezonu boja za kompletne stilske preporuke',
      book_analysis: 'Saznaj više',
      // Screen 4 - Season
      your_season: 'Vaša sezona',
      season_subtitle: 'Izaberite sezonu boja koju ste dobili na analizi kod Dajane.',
      season_info: 'Koristićemo vašu sezonu da vam prikažemo outfite u bojama koje vam najbolje stoje.',
      skip: 'Preskoči',
      select_season: 'Molimo izaberite vašu sezonu boja',
      // Screen 4 - Complete
      all_set: 'Sve je spremno!',
      complete_subtitle: 'Vaš profil je podešen. Sada možete da istražite outfite prilagođene vašem stilu.',
      your_profile: 'Vaš profil',
      not_selected: 'Nije izabrano',
      what_awaits: 'Šta vas čeka',
      feature_outfits: 'Personalizovani outfiti za vaš tip građe',
      feature_tryon: 'AI Try-On - isprobajte odeću virtuelno',
      feature_advisor: 'Dajana AI savetnik za stil',
      start: 'Započni',
      permissions_title: 'Pristup kameri i galeriji',
      permissions_message: 'Dajana treba pristup kameri i galeriji za Try-On (fotografisanje lica) i izbor slika. Dozvole možete promeniti u Podešavanjima uređaja.',
      permission_camera_title: 'Pristup kameri',
      permission_camera_desc: 'Potrebna nam je dozvola za kameru da biste mogli da se fotografišete za Try-On i isprobate odeću virtuelno.',
      permission_gallery_title: 'Pristup galeriji',
      permission_gallery_desc: 'Potrebna nam je dozvola za galeriju da biste mogli da birate slike za Try-On i Dajanin savetnik.',
      permission_allow: 'Dozvoli',
      permission_continue: 'Započni',
    },

    // Seasons
    seasons: {
      spring: 'Proleće',
      summer: 'Leto',
      autumn: 'Jesen',
      winter: 'Zima',
      light_spring: 'Svetlo proleće',
      warm_spring: 'Toplo proleće',
      clear_spring: 'Čisto proleće',
      light_summer: 'Svetlo leto',
      cool_summer: 'Hladno leto',
      soft_summer: 'Meko leto',
      soft_autumn: 'Meka jesen',
      warm_autumn: 'Topla jesen',
      deep_autumn: 'Duboka jesen',
      deep_winter: 'Duboka zima',
      cool_winter: 'Hladna zima',
      clear_winter: 'Čista zima',
    },

    // Body Types
    body_types: {
      hourglass: 'Peščani sat',
      pear: 'Kruška',
      apple: 'Jabuka',
      rectangle: 'Pravougaonik',
      inverted_triangle: 'Obrnuti trougao',
      unknown: 'Nepoznato',
      hourglass_desc: 'Grudi i kukovi su slični, struk je izraženo uži',
      pear_desc: 'Kukovi su širi od grudi',
      apple_desc: 'Struk je širi, manje definisan',
      rectangle_desc: 'Grudi, struk i kukovi su slični',
      inverted_triangle_desc: 'Grudi su šire od kukova',
    },

    // Credits
    credits: {
      no_subscription: 'Nemate aktivnu pretplatu',
      no_credits: 'Nemate dovoljno kredita',
      image_credits: 'Krediti za slike',
      video_credits: 'Krediti za videe',
      analysis_credits: 'Krediti za analize',
    },

    // API Errors
    errors: {
      network: 'Nema internet konekcije. Proverite vašu mrežu.',
      timeout: 'Zahtev je istekao. Pokušajte ponovo.',
      not_found: 'Podaci nisu pronađeni.',
      unauthorized: 'Sesija je istekla. Prijavite se ponovo.',
      server: 'Greška na serveru. Pokušajte ponovo.',
      unknown: 'Došlo je do greške.',
      save_failed: 'Čuvanje nije uspelo.',
      load_failed: 'Učitavanje nije uspelo.',
      delete_failed: 'Brisanje nije uspelo.',
      try_again: 'Pokušajte ponovo',
      no_internet: 'Nema interneta',
    },

    // Capsule Wardrobe
    capsule: {
      title: 'Kapsula Garderobe',
      subtitle: 'Outfiti prilagođeni za vas',
      outfits_for_you: 'Kombinacije i outfiti pripremljeni samo za tebe.',
      categories: {
        all: 'Sve',
        tops: 'Gornji deo',
        bottoms: 'Donji deo',
        dresses: 'Haljine',
        outerwear: 'Jakne',
        accessories: 'Aksesori',
        obuca: 'Obuca',
        complete_looks: 'Kompletni outfiti',
      },
      filters: {
        title: 'Filteri',
        body_type: 'Tip građe',
        season: 'Sezona',
        clear_filters: 'Obriši filtere',
        apply: 'Primeni',
        my_body_type: 'Moj tip',
        my_season: 'Moja sezona',
        all_body_types: 'Svi tipovi',
        all_seasons: 'Sve sezone',
      },
      outfit_label: 'Outfit',
      outfit: {
        for_body_types: 'Za tipove građe',
        for_seasons: 'Za sezone',
        try_on: 'Isprobaj',
        try_on_soon: 'Isprobaj outfit - uskoro!',
        save: 'Sačuvaj',
        saved: 'Sačuvano',
        unsave: 'Ukloni iz sačuvanih',
        share: 'Podeli',
      },
      empty: {
        title: 'Nema outfita',
        subtitle: 'Nema outfita koji odgovaraju vašim filterima',
        clear_filters: 'Obriši filtere',
        no_saved: 'Nemate sačuvanih outfita',
        no_saved_subtitle: 'Pritisnite srce na outfitu da ga sačuvate',
      },
      tabs: {
        browse: 'Pretraži',
        saved: 'Sačuvano',
      },
      loading: 'Učitavanje outfita...',
      error_load: 'Greška pri učitavanju outfita',
      personalized: 'Personalizovano za vas',
      personalized_desc: 'Na osnovu vašeg tipa građe i sezone',
    },

    // Wardrobe choice (pre Capsule tab)
    wardrobe_choice: {
      choice_hint: 'Kapsula ili Ormar — odaberite odakle želite da krenete.',
      capsule_title: 'Kapsula',
      capsule_subtitle: 'Pravi svoj outfit',
      ormar_title: 'Ormar outfita',
      ormar_subtitle: 'Kompletni outfiti od Dajane',
    },
    ormar: {
      title: 'Virtualni ormar',
      panel_subtitle: 'Izaberi outfit i isprobaj',
      swipe_hint: 'Swipe',
      tap_hanger: 'Dodirni ofinger za gotove outfite',
      swipe_to_discover: 'Swipe za otkrivanje drugih outfita',
      complete_outfits: 'Kompletni outfiti',
      close: 'Zatvori',
    },

    // Placeholders
    coming_soon: 'Uskoro',
    coming_in_phase: 'Dolazi u Fazi',

    // Try-On
    try_on: {
      welcome_title: 'AI Try-On',
      welcome_subtitle: 'Slikajte lice za najbolji rezultat. Izaberi fotku ili se uslikaj u sledećem koraku.',
      welcome_next: 'Dalje',
      welcome_secondary_btn: 'Vidi šta je u ormaru',
      permission_gallery: 'Potrebna je dozvola za pristup galeriji',
      permission_camera: 'Potrebna je dozvola za kameru',
      error_pick_image: 'Greška pri izboru slike',
      error_camera: 'Greška pri fotografisanju',
      error_select_image: 'Molimo izaberite sliku',
      error_no_face: 'Nedostaje slika lica. Vrati se i izaberi fotografiju.',
      selected_outfit: 'Izabrani outfit',
      shop_btn: 'Shop',
      generating_step1: 'Analiziram tvoj stil...',
      generating_step2: 'Biram savršeni kroj...',
      generating_step3: 'Kreiram tvoj outfit...',
      generating_step4: 'Dodajem završne detalje...',
      generating_step5: 'Doradjujemo završne detalje...',
      retry: 'Ponovo',
    },

    // AI Advice / Chat
    ai_advice: {
      empty_subtitle: 'Napiši poruku ispod',
      placeholder: 'Poruka Dajani…',
      choose_image_card_title: 'Izaberi sliku koju si generisala',
      choose_image_card_subtitle: 'Dobićeš mišljenje od Dajane',
      choose_image_btn: 'Izaberi sliku',
      no_images: 'Nemaš generisane slike',
      no_images_hint: 'Isprobaj outfit u Kapsuli pa se vrati ovde',
      modal_title: 'Izaberi sliku',
      modal_subtitle: 'Izaberi generisanu sliku za Dajanin savet',
      error_ai: 'Izvinite, desila se greška. Pokušajte ponovo.',
      error_ai_comm: 'Greška u komunikaciji sa AI.',
      no_credits_message: 'Nemate aktivnu pretplatu niti kredite za generisanje. Obnovite pretplatu ili kupite dopunu u Shopu.',
      try_on_question: 'Isprobala sam ovaj outfit virtuelno. Kako mi stoji? Daj mi savete!',
      chat_list_title: 'Sačuvani razgovori',
      chat_list_empty: 'Nemaš još sačuvanih razgovora. Započni novi i pritisni + da ga sačuvaš.',
      delete_chat_title: 'Obriši razgovor',
      delete_chat_message: 'Da li ste sigurni da želite da obrišete ovaj razgovor?',
      delete_chat_confirm: 'Obriši',
    },

    // Profile extras
    profile_user: 'Korisnik',
    profile_language_sr: 'Srpski',
    profile_language_en: 'English',

    // Credits display
    credits_renewal: 'Obnova: 31 dana od uplate',
    credits_this_month: 'ovaj mesec',

    // Video
    video: {
      prompt_placeholder: 'npr. okret levo...',
      scene_label: 'OPIS SCENE',
      hint_turn_left: 'Okret levo',
      hint_turn_right: 'Okret desno',
      hint_zoom: 'Zoom',
      creation_title: 'Kreacija',
      generating_min: 'Video se kreira ~%{min} min',
      continue_in_background: 'Nastavi u pozadini',
      video_ready: 'Tvoj video je spreman!',
      video_ready_subtitle: 'Pogledaj sada.',
      generated_images: 'Generisane slike',
      create_video: 'Kreiraj video',
      collection: 'Kolekcija',
      no_videos_yet: 'Još uvek niste kreirali nijedan video',
    },

    // Outfit Preview
    outfit_preview: {
      empty_message: 'Nisi izabrala nijedan outfit',
      back_btn: 'Nazad',
      your_choice: 'Tvoj izbor',
      clear_all: 'Obriši sve',
      what_to_make: 'Šta želiš da napraviš?',
      option_image: 'Slika',
      option_video: 'Video',
      try_on_btn: 'Isprobaj',
      items_selected_one: '%{count} komad izabrano',
      items_selected: '%{count} komada izabrano',
      option_image_sub: 'AI Try-On fotografija',
      option_video_sub: '5s AI animacija',
    },

    // Outfit Builder
    outfit_builder: {
      slot_outerwear: 'Jakna',
      slot_top: 'Gornji deo',
      slot_bottom: 'Donji deo',
      slot_shoes: 'Obuća',
      try_btn: 'Isprobaj',
      add_item: 'Dodaj',
      my_outfit: 'Moj outfit',
    },

    // Table builder zones (capsule)
    table_builder: {
      zone_outerwear: 'Kaput / Jakna',
      zone_top: 'Majica / Bluza',
      zone_bottom: 'Pantalone / Suknja',
      zone_shoes: 'Cipele',
      zone_accessory: 'Sat / Nakit',
      zone_bag: 'Tašna',
      screen_title: 'KAPSULA',
      screen_subtitle: 'Složi svoj outfit',
    },

    // Atelier (pre-chat)
    atelier: {
      occasion_evening: 'Večernji izlazak',
      occasion_business: 'Poslovni dan',
      occasion_travel: 'Putovanje',
      occasion_casual: 'Casual dan',
      default_name: 'Ana',
    },

    // Onboarding measurements
    onboarding_finish: 'Završi',

    // Notifications
    notifications: {
      title: 'Obaveštenja',
      today: 'Danas',
      yesterday: 'Juče',
      empty_title: 'Nema obaveštenja',
      empty_subtitle: 'Ovde će se pojaviti obaveštenja o videima i savetima.',
      new_count: 'nove',
      clear: 'Očisti',
    },

    // Calendar
    calendar: {
      title: 'Kalendar',
      subtitle: 'Ovde su svi vaši outfiti po datumima',
      empty: 'Nema sačuvanih kombinacija za ovaj mesec.',
      delete_confirm: 'Obriši ovu kombinaciju?',
      delete_title: 'Obriši outfit',
      delete_question: 'Da li ste sigurni?',
      outfits_for: 'Outfiti za',
      outfit_one: 'outfit',
      outfit_many: 'outfita',
      pieces_one: 'komad',
      pieces_many: 'komada',
      add_new: 'Dodaj novi outfit',
      january: 'Januar', february: 'Februar', march: 'Mart', april: 'April', may: 'Maj', june: 'Jun',
      july: 'Jul', august: 'Avgust', september: 'Septembar', october: 'Oktobar', november: 'Novembar', december: 'Decembar',
      sun: 'Ned', mon: 'Pon', tue: 'Uto', wed: 'Sre', thu: 'Čet', fri: 'Pet', sat: 'Sub',
    },

    // Common
    not_found_title: 'Ups!',
    not_found_message: 'Ova stranica ne postoji.',
    not_found_link: 'Idi na početnu',
    share_not_available: 'Deljenje nije dostupno na ovom uređaju',
  },

  en: {
    // Common
    app_name: 'DAJANA AI',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',

    // Auth
    auth: {
      // Welcome Screen
      your_personal_stylist: 'Your personal stylist',
      your_personal_ai_stylist: 'Your personal AI stylist',
      get_started: 'Get Started',
      welcome_headline: 'Elevate your style with Dajana',
      welcome_desc: 'Personalized recommendations, capsule wardrobe and AI advice tailored for you.',
      swipe_to_start: 'Swipe to start',
      skip: 'Skip',
      next: 'Continue',
      
      // Slide 1
      slide1_title: 'Discover Your Style',
      slide1_subtitle: 'Your personal stylist',
      slide1_desc: 'Discover outfits that highlight your natural beauty and bring back feminine energy',
      
      // Slide 2
      slide2_title: 'Personalized For You',
      slide2_subtitle: 'Your analysis, your style',
      slide2_desc: 'Based on your color and body analysis, get perfect wardrobe recommendations',
      
      // Slide 3
      slide3_title: 'Advice From Dajana',
      slide3_subtitle: 'Expertise at your fingertips',
      slide3_desc: 'Clear, simple and personalized fashion solutions that boost your confidence',
      
      welcome_back: 'Welcome back',
      sign_in_subtitle: 'Sign in to your account',
      create_account: 'Create account',
      sign_up_subtitle: 'Start your style journey',
      email: 'Email',
      email_placeholder: 'your@email.com',
      password: 'Password',
      password_placeholder: '••••••••',
      confirm_password: 'Confirm password',
      confirm_password_placeholder: 'Repeat password',
      full_name: 'Full name',
      full_name_placeholder: 'Jane Doe',
      sign_in: 'Sign in',
      sign_up: 'Sign up',
      sign_out: 'Sign out',
      forgot_password: 'Forgot password?',
      no_account: "Don't have an account?",
      have_account: 'Already have an account?',
      continue_as_guest: 'Continue as guest',
      register: 'Register',
      login: 'Login',
      reset_password: 'Reset password',
      reset_password_title: 'Forgot password?',
      reset_password_subtitle: 'Enter your email and we will send you a reset link',
      send_link: 'Send link',
      check_email: 'Check your email',
      email_sent: 'We sent a password reset link to',
      back_to_login: 'Back to login',
      remember_password: 'Remember your password?',
      min_password: 'At least 6 characters',

      // Errors
      error_invalid_credentials: 'Invalid email or password',
      error_email_not_confirmed: 'Please confirm your email address',
      error_email_exists: 'Email is already registered',
      error_generic: 'An error occurred',
      error_fill_all_fields: 'Please fill all fields',
      error_password_mismatch: 'Passwords do not match',
      error_password_too_short: 'Password must be at least 6 characters',
      error_enter_email: 'Please enter your email',
      error_enter_email_password: 'Please enter email and password',

      // Success
      success_registered: 'Registration successful!',
      success_check_email: 'Check your email to confirm your account.',
      account_exists: 'Account already exists',
      account_exists_message: 'A user with this email already exists. Try signing in.',
    },

    // Tabs
    tabs: {
      home: 'Home',
      capsule: 'Capsule',
      videos: 'Videos',
      ai_advice: 'AI Advice',
      profile: 'Profile',
    },

    // Home
    home: {
      hero_tagline: 'Your personal AI stylist',
      segment_outfit: 'OUTFIT',
      segment_video: 'VIDEO',
      segment_image: 'IMAGE',
      empty_swipe: 'Swipe and start creating',
      good_morning: 'Good morning',
      good_afternoon: 'Good afternoon',
      good_evening: 'Good evening',
      credits_title: 'Your credits (renewal every 31 days)',
      credits_hero_subtitle: 'Use images, video and analyses to upgrade your style with Dajana.',
      images: 'Images',
      videos: 'Videos',
      analyses: 'Analyses',
      bonus: 'bonus',
      quick_actions: 'Quick actions',
      try_outfit: 'Try outfit',
      make_video: 'Make video',
      ask_dajana: 'Ask Dajana',
      complete_profile: 'Complete your profile',
      complete_profile_desc: 'Enter your measurements to see personalized outfits',
      outfit_choice_title: 'Where do you want to see outfits from?',
      outfit_choose: 'Choose',
      outfit_from_capsule: 'From Capsule',
      outfit_capsule_short: 'Capsule',
      outfit_from_capsule_desc: 'Outfits you put together yourself',
      outfit_from_ormar: 'Wardrobe',
      outfit_ormar_short: 'Wardrobe',
      outfit_from_ormar_desc: 'Outfits generated by Dajana',
      outfit_back_choice: 'Back to choice',
      outfit_ormar_empty: 'Here are full images generated by Dajana. Try Try-on to get your first.',
      delete_outfit_title: 'Delete outfit',
      delete_outfit_message: 'Are you sure you want to delete this outfit?',
      delete_image_title: 'Delete image',
      delete_image_message: 'Are you sure you want to delete this generated image?',
      delete_video_title: 'Delete video',
      delete_video_message: 'Are you sure you want to delete this video?',
    },

    // Profile
    profile: {
      my_data: 'My data',
      body_type: 'Body type',
      season: 'Season',
      height: 'Height',
      weight: 'Weight',
      measurements: 'Measurements',
      bust: 'Bust',
      waist: 'Waist',
      hips: 'Hips',
      edit_data: 'Edit data',
      edit_link: 'Edit',
      credits: 'Credits',
      buy_more: 'Buy more credits',
      theme: 'Theme',
      theme_light: 'Light',
      theme_dark: 'Dark',
      language: 'Language',
      notifications: 'Notifications',
      help: 'Help',
      privacy_policy: 'Privacy Policy',
      sign_out: 'Sign out',
      sign_out_confirm: 'Are you sure you want to sign out?',
      delete_account: 'Delete account',
      delete_account_confirm: 'Are you sure? Your account and all data will be permanently deleted. This cannot be undone.',
      delete_account_success: 'Account deleted.',
      not_set: 'Not set',
      saved_menu: 'Saved',
      saved_screen_title: 'Saved',
    },
    guest_modal: {
      title: 'Create a profile',
      message: 'Only signed-in users can use this. Sign in or register to continue.',
      sign_in: 'Sign in',
      register: 'Register',
    },

    // Shop (Subscription and top-up)
    shop: {
      title: 'Subscription & credits',
      subtitle: 'Monthly or yearly subscription includes credits for images, videos and AI analyses. Top-up for overage.',
      section_subscription: 'Subscription',
      plan_monthly: 'Monthly',
      plan_monthly_desc: '50 images, 2 videos, 2 AI analyses – renewal every 31 days.',
      plan_yearly: 'Yearly',
      plan_yearly_desc: 'Same credit pack, pay once a year with discount.',
      section_topup: 'Top-up for overage',
      topup_name: 'Credit pack',
      topup_desc: '+10 images (capsule), +1 video, +2 AI analyses.',
      popular: 'Popular',
      images: 'Images',
      videos: 'Videos',
      analyses: 'Analyses',
      buy: 'Buy',
      subscribe: 'Subscribe',
      buy_confirm_title: 'Purchase',
      coming_soon_message: 'Payment for %{price} will be available soon. Thank you for your interest!',
      payment_method: 'Payment: Stripe (cards, Apple Pay, Google Pay).',
      footer_note: 'When your subscription expires, you can still view saved images, videos and advice; new generation requires renewal or top-up.',
      no_subscription_no_credits: 'You have no active subscription or credits for generation. Renew your subscription or buy a top-up in Shop.',
    },

    no_credits_modal: {
      title_image: 'No image credits',
      title_video: 'No video credits',
      message: 'Renew your subscription or buy a top-up in Shop to continue generating.',
      later: 'Later',
      go_to_shop: 'Renew subscription',
    },

    // Payment (simulation / Stripe)
    payment: {
      title: 'Payment',
      order_summary: 'Order summary',
      card_number: 'Card number',
      card_placeholder: '4242 4242 4242 4242',
      expiry: 'Expiry',
      expiry_placeholder: 'MM/YY',
      cvc: 'CVC',
      cvc_placeholder: '123',
      pay_btn: 'Pay %{amount}',
      processing: 'Processing...',
      success_title: 'Payment successful',
      success_message: 'Thank you. Your purchase has been recorded.',
      back_to_shop: 'Back to Shop',
      secure_note: 'Secure payment via Stripe. This is a simulation – no real charge.',
    },

    // Edit Profile
    edit_profile: {
      title: 'Edit profile',
      personal_data: 'Personal data',
      full_name: 'Full name',
      full_name_placeholder: 'Enter your name',
      measurements: 'Measurements',
      height: 'Height',
      weight: 'Weight',
      bust: 'Bust',
      waist: 'Waist',
      hips: 'Hips',
      color_season: 'Color season',
      color_season_subtitle: 'Select the color season that suits you best',
      save_changes: 'Save changes',
      saving: 'Saving...',
      success: 'Success',
      profile_updated: 'Profile updated',
      error_height: 'Height must be between 100 and 250 cm',
      error_measurements: 'Please check your measurements',
      error_save: 'An error occurred while saving',
    },

    // Onboarding
    onboarding: {
      step_of: 'Step %{current} of %{total}',
      // Screen 1 - Measurements
      your_measurements: 'Your measurements',
      measurements_subtitle: 'Enter your measurements so we can calculate your body type and personalize recommendations',
      height: 'Height',
      weight: 'Weight',
      weight_optional: 'Weight (optional)',
      bust: 'Bust',
      waist: 'Waist',
      hips: 'Hips',
      required: '*',
      bust_hint: 'Measure at the widest part of your bust',
      waist_hint: 'Measure at the narrowest part of your waist',
      hips_hint: 'Measure at the widest part of your hips',
      continue: 'Continue',
      saving: 'Saving...',
      error_required: 'Please enter all required measurements (height, bust, waist, hips)',
      error_height: 'Height must be between 100 and 250 cm',
      error_check_measurements: 'Please check your measurements',
      error_save: 'An error occurred while saving data',
      // Screen 2 - Body Type
      your_body_type: 'Your body type',
      body_type_subtitle: 'Based on your measurements, we calculated your body type',
      body_type_info: 'We will use this information to show you outfits that best suit your body type',
      // Screen 3 - Analysis Question
      analysis_question: 'Did you do an analysis?',
      analysis_subtitle: 'Have you done a professional color analysis with Dajana?',
      analysis_info: 'If you did an analysis with Dajana, you know your color season and can get personalized wardrobe recommendations.',
      yes_did_analysis: 'Yes, I did the analysis',
      no_skip_analysis: 'No, not yet',
      upsell_title: 'Want personalized colors?',
      upsell_text: 'Book an analysis with Dajana and discover your color season for complete style recommendations',
      book_analysis: 'Learn more',
      // Screen 4 - Season
      your_season: 'Your season',
      season_subtitle: 'Select your color season from your analysis with Dajana.',
      season_info: 'We will use your season to show you outfits in colors that suit you best.',
      skip: 'Skip',
      select_season: 'Please select your color season',
      // Screen 4 - Complete
      all_set: 'All set!',
      complete_subtitle: 'Your profile is ready. Now you can explore outfits tailored to your style.',
      your_profile: 'Your profile',
      not_selected: 'Not selected',
      what_awaits: 'What awaits you',
      feature_outfits: 'Personalized outfits for your body type',
      feature_tryon: 'AI Try-On - try clothes virtually',
      feature_advisor: 'Dajana AI style advisor',
      start: 'Start',
      permissions_title: 'Camera and gallery access',
      permissions_message: 'Dajana needs access to your camera and gallery for Try-On (taking a photo of your face) and choosing images. You can change these permissions in your device Settings.',
      permission_camera_title: 'Camera access',
      permission_camera_desc: 'We need camera permission so you can take a photo for Try-On and try on clothes virtually.',
      permission_gallery_title: 'Gallery access',
      permission_gallery_desc: 'We need gallery permission so you can choose photos for Try-On and Dajana\'s style advisor.',
      permission_allow: 'Allow',
      permission_continue: 'Start',
    },

    // Seasons
    seasons: {
      spring: 'Spring',
      summer: 'Summer',
      autumn: 'Autumn',
      winter: 'Winter',
      light_spring: 'Light Spring',
      warm_spring: 'Warm Spring',
      clear_spring: 'Clear Spring',
      light_summer: 'Light Summer',
      cool_summer: 'Cool Summer',
      soft_summer: 'Soft Summer',
      soft_autumn: 'Soft Autumn',
      warm_autumn: 'Warm Autumn',
      deep_autumn: 'Deep Autumn',
      deep_winter: 'Deep Winter',
      cool_winter: 'Cool Winter',
      clear_winter: 'Clear Winter',
    },

    // Body Types
    body_types: {
      hourglass: 'Hourglass',
      pear: 'Pear',
      apple: 'Apple',
      rectangle: 'Rectangle',
      inverted_triangle: 'Inverted Triangle',
      unknown: 'Unknown',
      hourglass_desc: 'Bust and hips are similar, waist is notably narrower',
      pear_desc: 'Hips are wider than bust',
      apple_desc: 'Waist is wider, less defined',
      rectangle_desc: 'Bust, waist and hips are similar',
      inverted_triangle_desc: 'Bust is wider than hips',
    },

    // Credits
    credits: {
      no_subscription: 'No active subscription',
      no_credits: 'Not enough credits',
      image_credits: 'Image credits',
      video_credits: 'Video credits',
      analysis_credits: 'Analysis credits',
    },

    // API Errors
    errors: {
      network: 'No internet connection. Check your network.',
      timeout: 'Request timed out. Please try again.',
      not_found: 'Data not found.',
      unauthorized: 'Session expired. Please sign in again.',
      server: 'Server error. Please try again.',
      unknown: 'An error occurred.',
      save_failed: 'Save failed.',
      load_failed: 'Loading failed.',
      delete_failed: 'Delete failed.',
      try_again: 'Try again',
      no_internet: 'No internet',
    },

    // Capsule Wardrobe
    capsule: {
      title: 'Capsule Wardrobe',
      subtitle: 'Outfits tailored for you',
      outfits_for_you: 'Combinations and outfits prepared just for you.',
      categories: {
        all: 'All',
        tops: 'Tops',
        bottoms: 'Bottoms',
        dresses: 'Dresses',
        outerwear: 'Outerwear',
        accessories: 'Accessories',
        obuca: 'Footwear',
        complete_looks: 'Complete Looks',
      },
      filters: {
        title: 'Filters',
        body_type: 'Body Type',
        season: 'Season',
        clear_filters: 'Clear filters',
        apply: 'Apply',
        my_body_type: 'My type',
        my_season: 'My season',
        all_body_types: 'All types',
        all_seasons: 'All seasons',
      },
      outfit_label: 'Outfit',
      outfit: {
        for_body_types: 'For body types',
        for_seasons: 'For seasons',
        try_on: 'Try On',
        try_on_soon: 'Try outfit - coming soon!',
        save: 'Save',
        saved: 'Saved',
        unsave: 'Remove from saved',
        share: 'Share',
      },
      empty: {
        title: 'No outfits',
        subtitle: 'No outfits match your filters',
        clear_filters: 'Clear filters',
        no_saved: 'No saved outfits',
        no_saved_subtitle: 'Tap the heart on an outfit to save it',
      },
      tabs: {
        browse: 'Browse',
        saved: 'Saved',
      },
      loading: 'Loading outfits...',
      error_load: 'Error loading outfits',
      personalized: 'Personalized for you',
      personalized_desc: 'Based on your body type and season',
    },

    wardrobe_choice: {
      choice_hint: 'Capsule or Closet — choose where to start.',
      capsule_title: 'Capsule',
      capsule_subtitle: 'Create your outfit',
      ormar_title: 'Outfit closet',
      ormar_subtitle: 'Complete outfits by Dajana',
    },
    ormar: {
      title: 'Virtual closet',
      panel_subtitle: 'Pick an outfit and try it on',
      swipe_hint: 'Swipe',
      tap_hanger: 'Tap the hanger for ready outfits',
      swipe_to_discover: 'Swipe to discover other outfits',
      complete_outfits: 'Complete outfits',
      close: 'Close',
    },

    // Placeholders
    coming_soon: 'Coming soon',
    coming_in_phase: 'Coming in Phase',

    // Try-On
    try_on: {
      welcome_title: 'AI Try-On',
      welcome_subtitle: 'Capture your face for the best result. Choose a photo or take one in the next step.',
      welcome_next: 'Next',
      welcome_secondary_btn: 'See what\'s in my closet',
      permission_gallery: 'Permission required to access the gallery',
      permission_camera: 'Permission required for the camera',
      error_pick_image: 'Error selecting image',
      error_camera: 'Error taking photo',
      error_select_image: 'Please select an image',
      error_no_face: 'Face image missing. Go back and choose a photo.',
      selected_outfit: 'Selected outfit',
      shop_btn: 'Shop',
      generating_step1: 'Analyzing your style...',
      generating_step2: 'Choosing the perfect cut...',
      generating_step3: 'Creating your outfit...',
      generating_step4: 'Adding finishing touches...',
      generating_step5: 'Adding final touches...',
      retry: 'Again',
    },

    // AI Advice / Chat
    ai_advice: {
      empty_subtitle: 'Type a message below',
      placeholder: 'Describe how you want to look today…',
      choose_image_card_title: 'Pick an image you generated',
      choose_image_card_subtitle: "You'll get Dajana's opinion",
      choose_image_btn: 'Choose image',
      no_images: "You have no generated images",
      no_images_hint: 'Try an outfit in Capsule then come back here',
      modal_title: 'Choose image',
      modal_subtitle: 'Choose a generated image for Dajana\'s advice',
      error_ai: 'Sorry, something went wrong. Please try again.',
      error_ai_comm: 'Error communicating with AI.',
      no_credits_message: 'You have no active subscription or credits for generation. Renew your subscription or buy a top-up in Shop.',
      try_on_question: 'I tried this outfit virtually. How does it look? Give me advice!',
      chat_list_title: 'Saved chats',
      chat_list_empty: 'No saved chats yet. Start a new one and tap + to save it.',
      delete_chat_title: 'Delete chat',
      delete_chat_message: 'Are you sure you want to delete this chat?',
      delete_chat_confirm: 'Delete',
    },

    // Profile extras
    profile_user: 'User',
    profile_language_sr: 'Serbian',
    profile_language_en: 'English',

    // Credits display
    credits_renewal: 'Renewal: 31 days from payment',
    credits_this_month: 'this month',

    // Video
    video: {
      prompt_placeholder: 'e.g. turn left...',
      scene_label: 'SCENE DESCRIPTION',
      hint_turn_left: 'Turn left',
      hint_turn_right: 'Turn right',
      hint_zoom: 'Zoom',
      creation_title: 'Creation',
      generating_min: 'Video creating ~%{min} min',
      continue_in_background: 'Continue in background',
      video_ready: 'Your video is ready!',
      video_ready_subtitle: 'Watch now.',
      generated_images: 'Generated images',
      create_video: 'Create video',
      collection: 'Collection',
      no_videos_yet: "You haven't created any video yet",
    },

    // Outfit Preview
    outfit_preview: {
      empty_message: "You haven't selected any outfit",
      back_btn: 'Back',
      your_choice: 'Your selection',
      clear_all: 'Clear all',
      what_to_make: 'What would you like to create?',
      option_image: 'Image',
      option_video: 'Video',
      try_on_btn: 'Try on',
      items_selected_one: '%{count} item selected',
      items_selected: '%{count} items selected',
      option_image_sub: 'AI Try-On photo',
      option_video_sub: '5s AI animation',
    },

    // Outfit Builder
    outfit_builder: {
      slot_outerwear: 'Jacket',
      slot_top: 'Top',
      slot_bottom: 'Bottom',
      slot_shoes: 'Shoes',
      try_btn: 'Try on',
      add_item: 'Add',
      my_outfit: 'My outfit',
    },

    // Table builder zones (capsule)
    table_builder: {
      zone_outerwear: 'Coat / Jacket',
      zone_top: 'Shirt / Blouse',
      zone_bottom: 'Pants / Skirt',
      zone_shoes: 'Shoes',
      zone_accessory: 'Watch / Jewelry',
      zone_bag: 'Bag',
      screen_title: 'CAPSULE',
      screen_subtitle: 'Build your outfit',
    },

    // Atelier (pre-chat)
    atelier: {
      occasion_evening: 'Evening out',
      occasion_business: 'Business day',
      occasion_travel: 'Travel',
      occasion_casual: 'Casual day',
      default_name: 'Ana',
    },

    // Onboarding measurements
    onboarding_finish: 'Finish',

    // Notifications
    notifications: {
      title: 'Notifications',
      today: 'Today',
      yesterday: 'Yesterday',
      empty_title: 'No notifications',
      empty_subtitle: 'Notifications about videos and advice will appear here.',
      new_count: 'new',
      clear: 'Clear',
    },

    // Calendar
    calendar: {
      title: 'Calendar',
      subtitle: 'All your outfits by date',
      empty: 'No saved combinations for this month.',
      delete_confirm: 'Delete this combination?',
      delete_title: 'Delete outfit',
      delete_question: 'Are you sure?',
      outfits_for: 'Outfits for',
      outfit_one: 'outfit',
      outfit_many: 'outfits',
      pieces_one: 'piece',
      pieces_many: 'pieces',
      add_new: 'Add new outfit',
      january: 'January', february: 'February', march: 'March', april: 'April', may: 'May', june: 'June',
      july: 'July', august: 'August', september: 'September', october: 'October', november: 'November', december: 'December',
      sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
    },

    // Common
    not_found_title: 'Oops!',
    not_found_message: "This screen doesn't exist.",
    not_found_link: 'Go to home screen',
    share_not_available: 'Sharing is not available on this device',
  },
};

// Create i18n instance
const i18n = new I18n(translations);

// SRPSKI je DEFAULT jezik - uvek
i18n.locale = 'sr';

// Enable fallback to Serbian
i18n.enableFallback = true;
i18n.defaultLocale = 'sr';

export { i18n };

// Helper to change language
export const setLanguage = (lang: 'sr' | 'en') => {
  i18n.locale = lang;
};

// Get current language
export const getLanguage = (): 'sr' | 'en' => {
  return i18n.locale as 'sr' | 'en';
};

// Translation helper with type safety
export const t = (key: string, options?: object): string => {
  return i18n.t(key, options);
};
