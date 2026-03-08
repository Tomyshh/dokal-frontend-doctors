-- Generated from src/i18n/messages/*.json
-- Run this on your Supabase database (SQL Editor or psql)
-- After running: invalidate Redis cache for specialties or restart backend

BEGIN;

UPDATE public.specialties SET
  name_he = 'רפואה כללית',
  name_fr = 'Médecine générale',
  name_ru = 'Общая врачебная практика',
  name_es = 'General practice',
  name_am = 'General practice',
  name_en = 'General practice'
WHERE name = 'General practice';

UPDATE public.specialties SET
  name_he = 'רפואת משפחה',
  name_fr = 'Médecine familiale',
  name_ru = 'Семейная медицина',
  name_es = 'Family medicine',
  name_am = 'Family medicine',
  name_en = 'Family medicine'
WHERE name = 'Family medicine';

UPDATE public.specialties SET
  name_he = 'רפואה פנימית',
  name_fr = 'Médecine interne',
  name_ru = 'Терапия',
  name_es = 'Internal medicine',
  name_am = 'Internal medicine',
  name_en = 'Internal medicine'
WHERE name = 'Internal medicine';

UPDATE public.specialties SET
  name_he = 'רפואה דחופה',
  name_fr = 'Médecine d''urgence',
  name_ru = 'Скорая помощь',
  name_es = 'Emergency medicine',
  name_am = 'Emergency medicine',
  name_en = 'Emergency medicine'
WHERE name = 'Emergency medicine';

UPDATE public.specialties SET
  name_he = 'טיפול נמרץ',
  name_fr = 'Réanimation',
  name_ru = 'Реанимация',
  name_es = 'Critical care',
  name_am = 'Critical care',
  name_en = 'Critical care'
WHERE name = 'Critical care';

UPDATE public.specialties SET
  name_he = 'גריאטריה',
  name_fr = 'Gériatrie',
  name_ru = 'Гериатрия',
  name_es = 'Geriatrics',
  name_am = 'Geriatrics',
  name_en = 'Geriatrics'
WHERE name = 'Geriatrics';

UPDATE public.specialties SET
  name_he = 'טיפול פליאטיבי',
  name_fr = 'Soins palliatifs',
  name_ru = 'Паллиативная помощь',
  name_es = 'Palliative care',
  name_am = 'Palliative care',
  name_en = 'Palliative care'
WHERE name = 'Palliative care';

UPDATE public.specialties SET
  name_he = 'רפואת ספורט',
  name_fr = 'Médecine du sport',
  name_ru = 'Спортивная медицина',
  name_es = 'Sports medicine',
  name_am = 'Sports medicine',
  name_en = 'Sports medicine'
WHERE name = 'Sports medicine';

UPDATE public.specialties SET
  name_he = 'רפואה תעסוקתית',
  name_fr = 'Médecine du travail',
  name_ru = 'Профпатология',
  name_es = 'Occupational medicine',
  name_am = 'Occupational medicine',
  name_en = 'Occupational medicine'
WHERE name = 'Occupational medicine';

UPDATE public.specialties SET
  name_he = 'רפואה מונעת',
  name_fr = 'Médecine préventive',
  name_ru = 'Профилактическая медицина',
  name_es = 'Preventive medicine',
  name_am = 'Preventive medicine',
  name_en = 'Preventive medicine'
WHERE name = 'Preventive medicine';

UPDATE public.specialties SET
  name_he = 'בריאות הציבור',
  name_fr = 'Santé publique',
  name_ru = 'Общественное здоровье',
  name_es = 'Public health',
  name_am = 'Public health',
  name_en = 'Public health'
WHERE name = 'Public health';

UPDATE public.specialties SET
  name_he = 'רפואה אווירית',
  name_fr = 'Médecine aérospatiale',
  name_ru = 'Авиационная медицина',
  name_es = 'Aerospace medicine',
  name_am = 'Aerospace medicine',
  name_en = 'Aerospace medicine'
WHERE name = 'Aerospace medicine';

UPDATE public.specialties SET
  name_he = 'רפואה משפטית',
  name_fr = 'Médecine légale',
  name_ru = 'Судебная медицина',
  name_es = 'Forensic medicine',
  name_am = 'Forensic medicine',
  name_en = 'Forensic medicine'
WHERE name = 'Forensic medicine';

UPDATE public.specialties SET
  name_he = 'קרדיולוגיה',
  name_fr = 'Cardiologie',
  name_ru = 'Кардиология',
  name_es = 'Cardiology',
  name_am = 'Cardiology',
  name_en = 'Cardiology'
WHERE name = 'Cardiology';

UPDATE public.specialties SET
  name_he = 'קרדיולוגיה ילדים',
  name_fr = 'Cardiologie pédiatrique',
  name_ru = 'Детская кардиология',
  name_es = 'Pediatric cardiology',
  name_am = 'Pediatric cardiology',
  name_en = 'Pediatric cardiology'
WHERE name = 'Pediatric cardiology';

UPDATE public.specialties SET
  name_he = 'כירורגיית לב',
  name_fr = 'Chirurgie cardiaque',
  name_ru = 'Кардиохирургия',
  name_es = 'Cardiac surgery',
  name_am = 'Cardiac surgery',
  name_en = 'Cardiac surgery'
WHERE name = 'Cardiac surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיית חזה',
  name_fr = 'Chirurgie thoracique',
  name_ru = 'Торакальная хирургия',
  name_es = 'Thoracic surgery',
  name_am = 'Thoracic surgery',
  name_en = 'Thoracic surgery'
WHERE name = 'Thoracic surgery';

UPDATE public.specialties SET
  name_he = 'רפואת עור',
  name_fr = 'Dermatologie',
  name_ru = 'Дерматология',
  name_es = 'Dermatology',
  name_am = 'Dermatology',
  name_en = 'Dermatology'
WHERE name = 'Dermatology';

UPDATE public.specialties SET
  name_he = 'כירורגיה דרמטולוגית',
  name_fr = 'Chirurgie dermatologique',
  name_ru = 'Дерматохирургия',
  name_es = 'Dermatologic surgery',
  name_am = 'Dermatologic surgery',
  name_en = 'Dermatologic surgery'
WHERE name = 'Dermatologic surgery';

UPDATE public.specialties SET
  name_he = 'דרמטופתולוגיה',
  name_fr = 'Dermatopathologie',
  name_ru = 'Дерматопатология',
  name_es = 'Dermatopathology',
  name_am = 'Dermatopathology',
  name_en = 'Dermatopathology'
WHERE name = 'Dermatopathology';

UPDATE public.specialties SET
  name_he = 'רפואת ילדים',
  name_fr = 'Pédiatrie',
  name_ru = 'Педиатрия',
  name_es = 'Pediatrics',
  name_am = 'Pediatrics',
  name_en = 'Pediatrics'
WHERE name = 'Pediatrics';

UPDATE public.specialties SET
  name_he = 'נאונטולוגיה',
  name_fr = 'Néonatologie',
  name_ru = 'Неонатология',
  name_es = 'Neonatology',
  name_am = 'Neonatology',
  name_en = 'Neonatology'
WHERE name = 'Neonatology';

UPDATE public.specialties SET
  name_he = 'כירורגיית ילדים',
  name_fr = 'Chirurgie pédiatrique',
  name_ru = 'Детская хирургия',
  name_es = 'Pediatric surgery',
  name_am = 'Pediatric surgery',
  name_en = 'Pediatric surgery'
WHERE name = 'Pediatric surgery';

UPDATE public.specialties SET
  name_he = 'נוירולוגיה ילדים',
  name_fr = 'Neurologie pédiatrique',
  name_ru = 'Детская неврология',
  name_es = 'Pediatric neurology',
  name_am = 'Pediatric neurology',
  name_en = 'Pediatric neurology'
WHERE name = 'Pediatric neurology';

UPDATE public.specialties SET
  name_he = 'גסטרואנטרולוגיה ילדים',
  name_fr = 'Gastro-entérologie pédiatrique',
  name_ru = 'Детская гастроэнтерология',
  name_es = 'Pediatric gastroenterology',
  name_am = 'Pediatric gastroenterology',
  name_en = 'Pediatric gastroenterology'
WHERE name = 'Pediatric gastroenterology';

UPDATE public.specialties SET
  name_he = 'פולמונולוגיה ילדים',
  name_fr = 'Pneumologie pédiatrique',
  name_ru = 'Детская пульмонология',
  name_es = 'Pediatric pulmonology',
  name_am = 'Pediatric pulmonology',
  name_en = 'Pediatric pulmonology'
WHERE name = 'Pediatric pulmonology';

UPDATE public.specialties SET
  name_he = 'נפרולוגיה ילדים',
  name_fr = 'Néphrologie pédiatrique',
  name_ru = 'Детская нефрология',
  name_es = 'Pediatric nephrology',
  name_am = 'Pediatric nephrology',
  name_en = 'Pediatric nephrology'
WHERE name = 'Pediatric nephrology';

UPDATE public.specialties SET
  name_he = 'אנדוקרינולוגיה ילדים',
  name_fr = 'Endocrinologie pédiatrique',
  name_ru = 'Детская эндокринология',
  name_es = 'Pediatric endocrinology',
  name_am = 'Pediatric endocrinology',
  name_en = 'Pediatric endocrinology'
WHERE name = 'Pediatric endocrinology';

UPDATE public.specialties SET
  name_he = 'אונקולוגיה ילדים',
  name_fr = 'Oncologie pédiatrique',
  name_ru = 'Детская онкология',
  name_es = 'Pediatric oncology',
  name_am = 'Pediatric oncology',
  name_en = 'Pediatric oncology'
WHERE name = 'Pediatric oncology';

UPDATE public.specialties SET
  name_he = 'רפואה דחופה לילדים',
  name_fr = 'Urgences pédiatriques',
  name_ru = 'Детская неотложная помощь',
  name_es = 'Pediatric emergency medicine',
  name_am = 'Pediatric emergency medicine',
  name_en = 'Pediatric emergency medicine'
WHERE name = 'Pediatric emergency medicine';

UPDATE public.specialties SET
  name_he = 'רפואת מתבגרים',
  name_fr = 'Médecine de l''adolescent',
  name_ru = 'Подростковая медицина',
  name_es = 'Adolescent medicine',
  name_am = 'Adolescent medicine',
  name_en = 'Adolescent medicine'
WHERE name = 'Adolescent medicine';

UPDATE public.specialties SET
  name_he = 'רפואת ילדים התפתחותית',
  name_fr = 'Pédiatrie du développement',
  name_ru = 'Педиатрия развития',
  name_es = 'Developmental pediatrics',
  name_am = 'Developmental pediatrics',
  name_en = 'Developmental pediatrics'
WHERE name = 'Developmental pediatrics';

UPDATE public.specialties SET
  name_he = 'פסיכיאטריה של הילד והמתבגר',
  name_fr = 'Psychiatrie de l''enfant et de l''adolescent',
  name_ru = 'Детская психиатрия',
  name_es = 'Child and adolescent psychiatry',
  name_am = 'Child and adolescent psychiatry',
  name_en = 'Child and adolescent psychiatry'
WHERE name = 'Child and adolescent psychiatry';

UPDATE public.specialties SET
  name_he = 'רפואת נשים',
  name_fr = 'Gynécologie',
  name_ru = 'Гинекология',
  name_es = 'Gynecology',
  name_am = 'Gynecology',
  name_en = 'Gynecology'
WHERE name = 'Gynecology';

UPDATE public.specialties SET
  name_he = 'מיילדות',
  name_fr = 'Obstétrique',
  name_ru = 'Акушерство',
  name_es = 'Obstetrics',
  name_am = 'Obstetrics',
  name_en = 'Obstetrics'
WHERE name = 'Obstetrics';

UPDATE public.specialties SET
  name_he = 'רפואת נשים ומיילדות',
  name_fr = 'Gynécologie-obstétrique',
  name_ru = 'Акушерство и гинекология',
  name_es = 'Obstetrics and gynecology',
  name_am = 'Obstetrics and gynecology',
  name_en = 'Obstetrics and gynecology'
WHERE name = 'Obstetrics and gynecology';

UPDATE public.specialties SET
  name_he = 'אנדוקרינולוגיה של הפוריות',
  name_fr = 'Endocrinologie de la reproduction',
  name_ru = 'Реподуктивная эндокринология',
  name_es = 'Reproductive endocrinology',
  name_am = 'Reproductive endocrinology',
  name_en = 'Reproductive endocrinology'
WHERE name = 'Reproductive endocrinology';

UPDATE public.specialties SET
  name_he = 'רפואה אימהית-עוברית',
  name_fr = 'Médecine fœto-maternelle',
  name_ru = 'Медицина матери и плода',
  name_es = 'Maternal-fetal medicine',
  name_am = 'Maternal-fetal medicine',
  name_en = 'Maternal-fetal medicine'
WHERE name = 'Maternal-fetal medicine';

UPDATE public.specialties SET
  name_he = 'אורתופדיה',
  name_fr = 'Orthopédie',
  name_ru = 'Ортопедия',
  name_es = 'Orthopedics',
  name_am = 'Orthopedics',
  name_en = 'Orthopedics'
WHERE name = 'Orthopedics';

UPDATE public.specialties SET
  name_he = 'כירורגיה אורתופדית',
  name_fr = 'Chirurgie orthopédique',
  name_ru = 'Ортопедическая хирургия',
  name_es = 'Orthopedic surgery',
  name_am = 'Orthopedic surgery',
  name_en = 'Orthopedic surgery'
WHERE name = 'Orthopedic surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיית טראומה',
  name_fr = 'Chirurgie traumatologique',
  name_ru = 'Травматология',
  name_es = 'Trauma surgery',
  name_am = 'Trauma surgery',
  name_en = 'Trauma surgery'
WHERE name = 'Trauma surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיית יד',
  name_fr = 'Chirurgie de la main',
  name_ru = 'Хирургия кисти',
  name_es = 'Hand surgery',
  name_am = 'Hand surgery',
  name_en = 'Hand surgery'
WHERE name = 'Hand surgery';

UPDATE public.specialties SET
  name_he = 'ראומטולוגיה',
  name_fr = 'Rhumatologie',
  name_ru = 'Ревматология',
  name_es = 'Rheumatology',
  name_am = 'Rheumatology',
  name_en = 'Rheumatology'
WHERE name = 'Rheumatology';

UPDATE public.specialties SET
  name_he = 'נוירולוגיה',
  name_fr = 'Neurologie',
  name_ru = 'Неврология',
  name_es = 'Neurology',
  name_am = 'Neurology',
  name_en = 'Neurology'
WHERE name = 'Neurology';

UPDATE public.specialties SET
  name_he = 'נוירוכירורגיה',
  name_fr = 'Neurochirurgie',
  name_ru = 'Нейрохирургия',
  name_es = 'Neurosurgery',
  name_am = 'Neurosurgery',
  name_en = 'Neurosurgery'
WHERE name = 'Neurosurgery';

UPDATE public.specialties SET
  name_he = 'נוירופתולוגיה',
  name_fr = 'Neuropathologie',
  name_ru = 'Нейропатология',
  name_es = 'Neuropathology',
  name_am = 'Neuropathology',
  name_en = 'Neuropathology'
WHERE name = 'Neuropathology';

UPDATE public.specialties SET
  name_he = 'פסיכיאטריה',
  name_fr = 'Psychiatrie',
  name_ru = 'Психиатрия',
  name_es = 'Psychiatry',
  name_am = 'Psychiatry',
  name_en = 'Psychiatry'
WHERE name = 'Psychiatry';

UPDATE public.specialties SET
  name_he = 'טיפול בהתמכרויות',
  name_fr = 'Addictologie',
  name_ru = 'Наркология',
  name_es = 'Addiction medicine',
  name_am = 'Addiction medicine',
  name_en = 'Addiction medicine'
WHERE name = 'Addiction medicine';

UPDATE public.specialties SET
  name_he = 'רפואת שינה',
  name_fr = 'Médecine du sommeil',
  name_ru = 'Медицина сна',
  name_es = 'Sleep medicine',
  name_am = 'Sleep medicine',
  name_en = 'Sleep medicine'
WHERE name = 'Sleep medicine';

UPDATE public.specialties SET
  name_he = 'רפואת כאב',
  name_fr = 'Médecine de la douleur',
  name_ru = 'Медицина боли',
  name_es = 'Pain medicine',
  name_am = 'Pain medicine',
  name_en = 'Pain medicine'
WHERE name = 'Pain medicine';

UPDATE public.specialties SET
  name_he = 'רדיולוגיה',
  name_fr = 'Radiologie',
  name_ru = 'Рентгенология',
  name_es = 'Radiology',
  name_am = 'Radiology',
  name_en = 'Radiology'
WHERE name = 'Radiology';

UPDATE public.specialties SET
  name_he = 'רפואה גרעינית',
  name_fr = 'Médecine nucléaire',
  name_ru = 'Ядерная медицина',
  name_es = 'Nuclear medicine',
  name_am = 'Nuclear medicine',
  name_en = 'Nuclear medicine'
WHERE name = 'Nuclear medicine';

UPDATE public.specialties SET
  name_he = 'אונקולוגיה קרינתית (רדיותרפיה)',
  name_fr = 'Radiothérapie',
  name_ru = 'Радиационная онкология',
  name_es = 'Radiation oncology',
  name_am = 'Radiation oncology',
  name_en = 'Radiation oncology'
WHERE name = 'Radiation oncology';

UPDATE public.specialties SET
  name_he = 'הרדמה',
  name_fr = 'Anesthésie-réanimation',
  name_ru = 'Анестезиология',
  name_es = 'Anesthesiology',
  name_am = 'Anesthesiology',
  name_en = 'Anesthesiology'
WHERE name = 'Anesthesiology';

UPDATE public.specialties SET
  name_he = 'כירורגיה כללית',
  name_fr = 'Chirurgie générale',
  name_ru = 'Общая хирургия',
  name_es = 'General surgery',
  name_am = 'General surgery',
  name_en = 'General surgery'
WHERE name = 'General surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיה פלסטית',
  name_fr = 'Chirurgie plastique',
  name_ru = 'Пластическая хирургия',
  name_es = 'Plastic surgery',
  name_am = 'Plastic surgery',
  name_en = 'Plastic surgery'
WHERE name = 'Plastic surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיה משקמת',
  name_fr = 'Chirurgie reconstructrice',
  name_ru = 'Реконструктивная хирургия',
  name_es = 'Reconstructive surgery',
  name_am = 'Reconstructive surgery',
  name_en = 'Reconstructive surgery'
WHERE name = 'Reconstructive surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיה בריאטרית',
  name_fr = 'Chirurgie bariatrique',
  name_ru = 'Бариатрическая хирургия',
  name_es = 'Bariatric surgery',
  name_am = 'Bariatric surgery',
  name_en = 'Bariatric surgery'
WHERE name = 'Bariatric surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיה קולורקטלית',
  name_fr = 'Chirurgie colorectale',
  name_ru = 'Колопроктология',
  name_es = 'Colorectal surgery',
  name_am = 'Colorectal surgery',
  name_en = 'Colorectal surgery'
WHERE name = 'Colorectal surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיה וסקולרית',
  name_fr = 'Chirurgie vasculaire',
  name_ru = 'Сосудистая хирургия',
  name_es = 'Vascular surgery',
  name_am = 'Vascular surgery',
  name_en = 'Vascular surgery'
WHERE name = 'Vascular surgery';

UPDATE public.specialties SET
  name_he = 'כירורגיה פה ולסת',
  name_fr = 'Chirurgie maxillo-faciale',
  name_ru = 'Челюстно-лицевая хирургия',
  name_es = 'Oral and maxillofacial surgery',
  name_am = 'Oral and maxillofacial surgery',
  name_en = 'Oral and maxillofacial surgery'
WHERE name = 'Oral and maxillofacial surgery';

UPDATE public.specialties SET
  name_he = 'רפואת אף־אוזן־גרון',
  name_fr = 'ORL',
  name_ru = 'Оториноларингология',
  name_es = 'ENT (Otolaryngology)',
  name_am = 'ENT (Otolaryngology)',
  name_en = 'ENT (Otolaryngology)'
WHERE name = 'ENT (Otolaryngology)';

UPDATE public.specialties SET
  name_he = 'רפואת עיניים',
  name_fr = 'Ophtalmologie',
  name_ru = 'Офтальмология',
  name_es = 'Ophthalmology',
  name_am = 'Ophthalmology',
  name_en = 'Ophthalmology'
WHERE name = 'Ophthalmology';

UPDATE public.specialties SET
  name_he = 'אורולוגיה',
  name_fr = 'Urologie',
  name_ru = 'Урология',
  name_es = 'Urology',
  name_am = 'Urology',
  name_en = 'Urology'
WHERE name = 'Urology';

UPDATE public.specialties SET
  name_he = 'אנדרולוגיה',
  name_fr = 'Andrologie',
  name_ru = 'Андрология',
  name_es = 'Andrology',
  name_am = 'Andrology',
  name_en = 'Andrology'
WHERE name = 'Andrology';

UPDATE public.specialties SET
  name_he = 'גסטרואנטרולוגיה',
  name_fr = 'Gastro-entérologie',
  name_ru = 'Гастроэнтерология',
  name_es = 'Gastroenterology',
  name_am = 'Gastroenterology',
  name_en = 'Gastroenterology'
WHERE name = 'Gastroenterology';

UPDATE public.specialties SET
  name_he = 'נפרולוגיה',
  name_fr = 'Néphrologie',
  name_ru = 'Нефрология',
  name_es = 'Nephrology',
  name_am = 'Nephrology',
  name_en = 'Nephrology'
WHERE name = 'Nephrology';

UPDATE public.specialties SET
  name_he = 'אנדוקרינולוגיה',
  name_fr = 'Endocrinologie',
  name_ru = 'Эндокринология',
  name_es = 'Endocrinology',
  name_am = 'Endocrinology',
  name_en = 'Endocrinology'
WHERE name = 'Endocrinology';

UPDATE public.specialties SET
  name_he = 'פולמונולוגיה',
  name_fr = 'Pneumologie',
  name_ru = 'Пульмонология',
  name_es = 'Pulmonology',
  name_am = 'Pulmonology',
  name_en = 'Pulmonology'
WHERE name = 'Pulmonology';

UPDATE public.specialties SET
  name_he = 'אלרגולוגיה',
  name_fr = 'Allergologie',
  name_ru = 'Аллергология',
  name_es = 'Allergology',
  name_am = 'Allergology',
  name_en = 'Allergology'
WHERE name = 'Allergology';

UPDATE public.specialties SET
  name_he = 'אימונולוגיה קלינית',
  name_fr = 'Immunologie clinique',
  name_ru = 'Клиническая иммунология',
  name_es = 'Clinical immunology',
  name_am = 'Clinical immunology',
  name_en = 'Clinical immunology'
WHERE name = 'Clinical immunology';

UPDATE public.specialties SET
  name_he = 'אונקולוגיה',
  name_fr = 'Oncologie',
  name_ru = 'Онкология',
  name_es = 'Oncology',
  name_am = 'Oncology',
  name_en = 'Oncology'
WHERE name = 'Oncology';

UPDATE public.specialties SET
  name_he = 'אונקולוגיה רפואית',
  name_fr = 'Oncologie médicale',
  name_ru = 'Медицинская онкология',
  name_es = 'Medical oncology',
  name_am = 'Medical oncology',
  name_en = 'Medical oncology'
WHERE name = 'Medical oncology';

UPDATE public.specialties SET
  name_he = 'המטולוגיה',
  name_fr = 'Hématologie',
  name_ru = 'Гематология',
  name_es = 'Hematology',
  name_am = 'Hematology',
  name_en = 'Hematology'
WHERE name = 'Hematology';

UPDATE public.specialties SET
  name_he = 'פתולוגיה (אנטומיה פתולוגית)',
  name_fr = 'Anatomopathologie',
  name_ru = 'Патологическая анатомия',
  name_es = 'Pathology',
  name_am = 'Pathology',
  name_en = 'Pathology'
WHERE name = 'Pathology';

UPDATE public.specialties SET
  name_he = 'ציטופתולוגיה',
  name_fr = 'Cytopathologie',
  name_ru = 'Цитопатология',
  name_es = 'Cytopathology',
  name_am = 'Cytopathology',
  name_en = 'Cytopathology'
WHERE name = 'Cytopathology';

UPDATE public.specialties SET
  name_he = 'אימונופתולוגיה',
  name_fr = 'Immunopathologie',
  name_ru = 'Иммунопатология',
  name_es = 'Immunopathology',
  name_am = 'Immunopathology',
  name_en = 'Immunopathology'
WHERE name = 'Immunopathology';

UPDATE public.specialties SET
  name_he = 'מחלות זיהומיות',
  name_fr = 'Maladies infectieuses',
  name_ru = 'Инфекционные болезни',
  name_es = 'Infectious diseases',
  name_am = 'Infectious diseases',
  name_en = 'Infectious diseases'
WHERE name = 'Infectious diseases';

UPDATE public.specialties SET
  name_he = 'רפואה פיזיקלית ושיקום',
  name_fr = 'Médecine physique et de réadaptation',
  name_ru = 'Физическая и реабилитационная медицина',
  name_es = 'Physical medicine and rehabilitation',
  name_am = 'Physical medicine and rehabilitation',
  name_en = 'Physical medicine and rehabilitation'
WHERE name = 'Physical medicine and rehabilitation';

UPDATE public.specialties SET
  name_he = 'ביולוגיה קלינית',
  name_fr = 'Biologie clinique',
  name_ru = 'Клиническая биология',
  name_es = 'Clinical biology',
  name_am = 'Clinical biology',
  name_en = 'Clinical biology'
WHERE name = 'Clinical biology';

UPDATE public.specialties SET
  name_he = 'פרמקולוגיה קלינית',
  name_fr = 'Pharmacologie clinique',
  name_ru = 'Клиническая фармакология',
  name_es = 'Clinical pharmacology',
  name_am = 'Clinical pharmacology',
  name_en = 'Clinical pharmacology'
WHERE name = 'Clinical pharmacology';

UPDATE public.specialties SET
  name_he = 'גנטיקה רפואית',
  name_fr = 'Génétique médicale',
  name_ru = 'Медицинская генетика',
  name_es = 'Medical genetics',
  name_am = 'Medical genetics',
  name_en = 'Medical genetics'
WHERE name = 'Medical genetics';

UPDATE public.specialties SET
  name_he = 'בנק דם',
  name_fr = 'Transfusion sanguine',
  name_ru = 'Служба крови',
  name_es = 'Blood bank',
  name_am = 'Blood bank',
  name_en = 'Blood bank'
WHERE name = 'Blood bank';

UPDATE public.specialties SET
  name_he = 'מיקרוביולוגיה',
  name_fr = 'Microbiologie',
  name_ru = 'Микробиология',
  name_es = 'Microbiology',
  name_am = 'Microbiology',
  name_en = 'Microbiology'
WHERE name = 'Microbiology';

UPDATE public.specialties SET
  name_he = 'כימיה קלינית',
  name_fr = 'Biochimie clinique',
  name_ru = 'Клиническая химия',
  name_es = 'Clinical chemistry',
  name_am = 'Clinical chemistry',
  name_en = 'Clinical chemistry'
WHERE name = 'Clinical chemistry';

UPDATE public.specialties SET
  name_he = 'רפואת שיניים',
  name_fr = 'Chirurgie dentaire',
  name_ru = 'Стоматология общей практики',
  name_es = 'General dentistry',
  name_am = 'General dentistry',
  name_en = 'General dentistry'
WHERE name = 'General dentistry';

UPDATE public.specialties SET
  name_he = 'אורתודונטיה',
  name_fr = 'Orthodontie',
  name_ru = 'Ортодонтия',
  name_es = 'Orthodontics',
  name_am = 'Orthodontics',
  name_en = 'Orthodontics'
WHERE name = 'Orthodontics';

UPDATE public.specialties SET
  name_he = 'פריודונטיה',
  name_fr = 'Parodontologie',
  name_ru = 'Пародонтология',
  name_es = 'Periodontics',
  name_am = 'Periodontics',
  name_en = 'Periodontics'
WHERE name = 'Periodontics';

UPDATE public.specialties SET
  name_he = 'רפואת שיניים לילדים',
  name_fr = 'Pédodontie',
  name_ru = 'Детская стоматология',
  name_es = 'Pediatric dentistry',
  name_am = 'Pediatric dentistry',
  name_en = 'Pediatric dentistry'
WHERE name = 'Pediatric dentistry';

UPDATE public.specialties SET
  name_he = 'אנדודונטיה',
  name_fr = 'Endodontie',
  name_ru = 'Эндодонтия',
  name_es = 'Endodontics',
  name_am = 'Endodontics',
  name_en = 'Endodontics'
WHERE name = 'Endodontics';

UPDATE public.specialties SET
  name_he = 'פרותודונטיה',
  name_fr = 'Prothèse dentaire',
  name_ru = 'Ортопедическая стоматология',
  name_es = 'Prosthodontics',
  name_am = 'Prosthodontics',
  name_en = 'Prosthodontics'
WHERE name = 'Prosthodontics';

UPDATE public.specialties SET
  name_he = 'רפואת הפה',
  name_fr = 'Médecine buccale',
  name_ru = 'Терапевтическая стоматология',
  name_es = 'Oral medicine',
  name_am = 'Oral medicine',
  name_en = 'Oral medicine'
WHERE name = 'Oral medicine';

UPDATE public.specialties SET
  name_he = 'בריאות הפה והשיניים (ציבורית)',
  name_fr = 'Santé bucco-dentaire publique',
  name_ru = 'Общественное здоровье полости рта',
  name_es = 'Dental public health',
  name_am = 'Dental public health',
  name_en = 'Dental public health'
WHERE name = 'Dental public health';

UPDATE public.specialties SET
  name_he = 'היגיינת שיניים',
  name_fr = 'Hygiène dentaire',
  name_ru = 'Гигиена полости рта',
  name_es = 'Dental hygiene',
  name_am = 'Dental hygiene',
  name_en = 'Dental hygiene'
WHERE name = 'Dental hygiene';

UPDATE public.specialties SET
  name_he = 'רוקחות',
  name_fr = 'Pharmacie',
  name_ru = 'Фармация',
  name_es = 'Pharmacy',
  name_am = 'Pharmacy',
  name_en = 'Pharmacy'
WHERE name = 'Pharmacy';

UPDATE public.specialties SET
  name_he = 'רוקחות קלינית',
  name_fr = 'Pharmacie clinique',
  name_ru = 'Клиническая фармация',
  name_es = 'Clinical pharmacy',
  name_am = 'Clinical pharmacy',
  name_en = 'Clinical pharmacy'
WHERE name = 'Clinical pharmacy';

UPDATE public.specialties SET
  name_he = 'רוקחות בית חולים',
  name_fr = 'Pharmacie hospitalière',
  name_ru = 'Больничная фармация',
  name_es = 'Hospital pharmacy',
  name_am = 'Hospital pharmacy',
  name_en = 'Hospital pharmacy'
WHERE name = 'Hospital pharmacy';

UPDATE public.specialties SET
  name_he = 'סיעוד',
  name_fr = 'Infirmier',
  name_ru = 'Сестринское дело',
  name_es = 'Nursing',
  name_am = 'Nursing',
  name_en = 'Nursing'
WHERE name = 'Nursing';

UPDATE public.specialties SET
  name_he = 'אח/ות מומחה',
  name_fr = 'Infirmier praticien',
  name_ru = 'Медсестра-специалист',
  name_es = 'Nurse practitioner',
  name_am = 'Nurse practitioner',
  name_en = 'Nurse practitioner'
WHERE name = 'Nurse practitioner';

UPDATE public.specialties SET
  name_he = 'מיילדות',
  name_fr = 'Sage-femme',
  name_ru = 'Акушерство',
  name_es = 'Midwifery',
  name_am = 'Midwifery',
  name_en = 'Midwifery'
WHERE name = 'Midwifery';

UPDATE public.specialties SET
  name_he = 'אח/ות מומחה קליני',
  name_fr = 'Infirmier clinicien spécialisé',
  name_ru = 'Клиническая медсестра-специалист',
  name_es = 'Clinical nurse specialist',
  name_am = 'Clinical nurse specialist',
  name_en = 'Clinical nurse specialist'
WHERE name = 'Clinical nurse specialist';

UPDATE public.specialties SET
  name_he = 'אח/ות מרדים',
  name_fr = 'Infirmier anesthésiste',
  name_ru = 'Медсестра-анестезист',
  name_es = 'Nurse anesthetist',
  name_am = 'Nurse anesthetist',
  name_en = 'Nurse anesthetist'
WHERE name = 'Nurse anesthetist';

UPDATE public.specialties SET
  name_he = 'פיזיותרפיה',
  name_fr = 'Kinésithérapie',
  name_ru = 'Физиотерапия',
  name_es = 'Physiotherapy',
  name_am = 'Physiotherapy',
  name_en = 'Physiotherapy'
WHERE name = 'Physiotherapy';

UPDATE public.specialties SET
  name_he = 'ריפוי בעיסוק',
  name_fr = 'Ergothérapie',
  name_ru = 'Эрготерапия',
  name_es = 'Occupational therapy',
  name_am = 'Occupational therapy',
  name_en = 'Occupational therapy'
WHERE name = 'Occupational therapy';

UPDATE public.specialties SET
  name_he = 'קלינאות תקשורת',
  name_fr = 'Orthophonie',
  name_ru = 'Логопедия',
  name_es = 'Speech therapy',
  name_am = 'Speech therapy',
  name_en = 'Speech therapy'
WHERE name = 'Speech therapy';

UPDATE public.specialties SET
  name_he = 'דיאטטיקה',
  name_fr = 'Diététique',
  name_ru = 'Диетология',
  name_es = 'Dietetics',
  name_am = 'Dietetics',
  name_en = 'Dietetics'
WHERE name = 'Dietetics';

UPDATE public.specialties SET
  name_he = 'תזונה',
  name_fr = 'Nutrition',
  name_ru = 'Нутрициология',
  name_es = 'Nutrition',
  name_am = 'Nutrition',
  name_en = 'Nutrition'
WHERE name = 'Nutrition';

UPDATE public.specialties SET
  name_he = 'פסיכולוגיה קלינית',
  name_fr = 'Psychologie clinique',
  name_ru = 'Клиническая психология',
  name_es = 'Clinical psychology',
  name_am = 'Clinical psychology',
  name_en = 'Clinical psychology'
WHERE name = 'Clinical psychology';

UPDATE public.specialties SET
  name_he = 'כירופרקטיקה',
  name_fr = 'Chiropraxie',
  name_ru = 'Хиропрактика',
  name_es = 'Chiropractic',
  name_am = 'Chiropractic',
  name_en = 'Chiropractic'
WHERE name = 'Chiropractic';

UPDATE public.specialties SET
  name_he = 'אוסטאופתיה',
  name_fr = 'Ostéopathie',
  name_ru = 'Остеопатия',
  name_es = 'Osteopathy',
  name_am = 'Osteopathy',
  name_en = 'Osteopathy'
WHERE name = 'Osteopathy';

UPDATE public.specialties SET
  name_he = 'פודיאטריה',
  name_fr = 'Podologie',
  name_ru = 'Подиатрия',
  name_es = 'Podiatry',
  name_am = 'Podiatry',
  name_en = 'Podiatry'
WHERE name = 'Podiatry';

UPDATE public.specialties SET
  name_he = 'אופטומטריה',
  name_fr = 'Optométrie',
  name_ru = 'Оптометрия',
  name_es = 'Optometry',
  name_am = 'Optometry',
  name_en = 'Optometry'
WHERE name = 'Optometry';

UPDATE public.specialties SET
  name_he = 'אורתופטיקה',
  name_fr = 'Orthoptie',
  name_ru = 'Ортоптика',
  name_es = 'Orthoptics',
  name_am = 'Orthoptics',
  name_en = 'Orthoptics'
WHERE name = 'Orthoptics';

UPDATE public.specialties SET
  name_he = 'אאודיולוגיה',
  name_fr = 'Audiologie',
  name_ru = 'Аудиология',
  name_es = 'Audiology',
  name_am = 'Audiology',
  name_en = 'Audiology'
WHERE name = 'Audiology';

UPDATE public.specialties SET
  name_he = 'עיסוי רפואי',
  name_fr = 'Masseur-kinésithérapeute',
  name_ru = 'Медицинский массаж',
  name_es = 'Medical massage',
  name_am = 'Medical massage',
  name_en = 'Medical massage'
WHERE name = 'Medical massage';

UPDATE public.specialties SET
  name_he = 'טיפול פסיכומוטורי',
  name_fr = 'Psychomotricité',
  name_ru = 'Психомоторика',
  name_es = 'Psychomotor therapy',
  name_am = 'Psychomotor therapy',
  name_en = 'Psychomotor therapy'
WHERE name = 'Psychomotor therapy';

UPDATE public.specialties SET
  name_he = 'דיקור',
  name_fr = 'Acupuncture',
  name_ru = 'Иглорефлексотерапия',
  name_es = 'Acupuncture',
  name_am = 'Acupuncture',
  name_en = 'Acupuncture'
WHERE name = 'Acupuncture';

UPDATE public.specialties SET
  name_he = 'נטורופתיה',
  name_fr = 'Naturopathie',
  name_ru = 'Натуротерапия',
  name_es = 'Naturopathy',
  name_am = 'Naturopathy',
  name_en = 'Naturopathy'
WHERE name = 'Naturopathy';

UPDATE public.specialties SET
  name_he = 'הומאופתיה',
  name_fr = 'Homéopathie',
  name_ru = 'Гомеопатия',
  name_es = 'Homeopathy',
  name_am = 'Homeopathy',
  name_en = 'Homeopathy'
WHERE name = 'Homeopathy';

UPDATE public.specialties SET
  name_he = 'צמחי מרפא',
  name_fr = 'Phytothérapie',
  name_ru = 'Фитотерапия',
  name_es = 'Herbal medicine',
  name_am = 'Herbal medicine',
  name_en = 'Herbal medicine'
WHERE name = 'Herbal medicine';

UPDATE public.specialties SET
  name_he = 'יועצת הנקה',
  name_fr = 'Consultant en lactation',
  name_ru = 'Консультант по грудному вскармливанию',
  name_es = 'Lactation consultant',
  name_am = 'Lactation consultant',
  name_en = 'Lactation consultant'
WHERE name = 'Lactation consultant';

UPDATE public.specialties SET
  name_he = 'מחנך סוכרת',
  name_fr = 'Éducateur en diabétologie',
  name_ru = 'Обучение пациентов с диабетом',
  name_es = 'Diabetes educator',
  name_am = 'Diabetes educator',
  name_en = 'Diabetes educator'
WHERE name = 'Diabetes educator';

UPDATE public.specialties SET
  name_he = 'מומחה טיפול בפצעים',
  name_fr = 'Spécialiste plaies et cicatrisation',
  name_ru = 'Специалист по ранам',
  name_es = 'Wound care specialist',
  name_am = 'Wound care specialist',
  name_en = 'Wound care specialist'
WHERE name = 'Wound care specialist';

UPDATE public.specialties SET
  name_he = 'טיפול בסטומה',
  name_fr = 'Soins stomathérapie',
  name_ru = 'Стоматерапия',
  name_es = 'Ostomy care',
  name_am = 'Ostomy care',
  name_en = 'Ostomy care'
WHERE name = 'Ostomy care';

UPDATE public.specialties SET
  name_he = 'יועץ גנטי',
  name_fr = 'Conseiller en génétique',
  name_ru = 'Генетический консультант',
  name_es = 'Genetic counselor',
  name_am = 'Genetic counselor',
  name_en = 'Genetic counselor'
WHERE name = 'Genetic counselor';

UPDATE public.specialties SET
  name_he = 'עובד סוציאלי',
  name_fr = 'Assistant de service social',
  name_ru = 'Социальный работник',
  name_es = 'Social worker',
  name_am = 'Social worker',
  name_en = 'Social worker'
WHERE name = 'Social worker';

UPDATE public.specialties SET
  name_he = 'מנהל מקרה',
  name_fr = 'Coordinateur de parcours',
  name_ru = 'Координатор случая',
  name_es = 'Case manager',
  name_am = 'Case manager',
  name_en = 'Case manager'
WHERE name = 'Case manager';

UPDATE public.specialties SET
  name_he = 'מתאם טיפול',
  name_fr = 'Coordinateur de soins',
  name_ru = 'Координатор ухода',
  name_es = 'Care coordinator',
  name_am = 'Care coordinator',
  name_en = 'Care coordinator'
WHERE name = 'Care coordinator';

UPDATE public.specialties SET
  name_he = 'עוזר רפואי',
  name_fr = 'Assistant médical',
  name_ru = 'Медицинский ассистент',
  name_es = 'Medical assistant',
  name_am = 'Medical assistant',
  name_en = 'Medical assistant'
WHERE name = 'Medical assistant';

UPDATE public.specialties SET
  name_he = 'מזכיר רפואי',
  name_fr = 'Secrétaire médicale',
  name_ru = 'Медицинский секретарь',
  name_es = 'Medical secretary',
  name_am = 'Medical secretary',
  name_en = 'Medical secretary'
WHERE name = 'Medical secretary';

UPDATE public.specialties SET
  name_he = 'טכנאי רפואי',
  name_fr = 'Technologue médical',
  name_ru = 'Медицинский технолог',
  name_es = 'Medical technologist',
  name_am = 'Medical technologist',
  name_en = 'Medical technologist'
WHERE name = 'Medical technologist';

UPDATE public.specialties SET
  name_he = 'טכנאי רנטגן',
  name_fr = 'Manipulateur en radiologie',
  name_ru = 'Рентгенолаборант',
  name_es = 'Radiology technologist',
  name_am = 'Radiology technologist',
  name_en = 'Radiology technologist'
WHERE name = 'Radiology technologist';

UPDATE public.specialties SET
  name_he = 'טכנאי מעבדה',
  name_fr = 'Technicien de laboratoire',
  name_ru = 'Лаборант',
  name_es = 'Laboratory technician',
  name_am = 'Laboratory technician',
  name_en = 'Laboratory technician'
WHERE name = 'Laboratory technician';

UPDATE public.specialties SET
  name_he = 'טכנאי/ת רוקחות',
  name_fr = 'Préparateur en pharmacie',
  name_ru = 'Фармацевт-технолог',
  name_es = 'Pharmacy technician',
  name_am = 'Pharmacy technician',
  name_en = 'Pharmacy technician'
WHERE name = 'Pharmacy technician';

UPDATE public.specialties SET
  name_he = 'מטפל נשימתי',
  name_fr = 'Kinésithérapeute respiratoire',
  name_ru = 'Респираторный терапевт',
  name_es = 'Respiratory therapist',
  name_am = 'Respiratory therapist',
  name_en = 'Respiratory therapist'
WHERE name = 'Respiratory therapist';

UPDATE public.specialties SET
  name_he = 'פרפוזיוניסט/ית',
  name_fr = 'Perfusionniste',
  name_ru = 'Перфузионист',
  name_es = 'Perfusionist',
  name_am = 'Perfusionist',
  name_en = 'Perfusionist'
WHERE name = 'Perfusionist';

UPDATE public.specialties SET
  name_he = 'טכנאי ניתוח',
  name_fr = 'Technicien en bloc opératoire',
  name_ru = 'Операционный техник',
  name_es = 'Surgical technologist',
  name_am = 'Surgical technologist',
  name_en = 'Surgical technologist'
WHERE name = 'Surgical technologist';

UPDATE public.specialties SET
  name_he = 'אחר',
  name_fr = 'Autre',
  name_ru = 'Другое',
  name_es = 'Other',
  name_am = 'Other',
  name_en = 'Other'
WHERE name = 'Other';

UPDATE public.specialties SET
  name_he = 'אלרגולוגיה',
  name_fr = 'Allergologie',
  name_ru = 'Аллергология',
  name_es = 'Allergology',
  name_am = 'Allergology',
  name_en = 'Allergology'
WHERE name = 'Allergy & Immunology';

UPDATE public.specialties SET
  name_he = 'כירורגיית חזה',
  name_fr = 'Chirurgie thoracique',
  name_ru = 'Торакальная хирургия',
  name_es = 'Thoracic surgery',
  name_am = 'Thoracic surgery',
  name_en = 'Thoracic surgery'
WHERE name = 'Cardiothoracic Surgery';

COMMIT;

-- Optional: verify with: SELECT id, name, name_he, name_fr FROM public.specialties LIMIT 5;