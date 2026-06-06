-- BoviTrack — Phase 8: seed data (Senegal livestock context)
-- Run with the service role (bypasses RLS). Idempotent via fixed UUIDs.
--
-- NOTE: auth users/profiles are created through Supabase Auth, then linked
-- to this farm by setting profiles.farm_id + role. This seed only creates
-- farm-scoped business data so the schema can be explored immediately.

-- 1 demo farm -------------------------------------------------------
insert into public.farms (id, name, region, department, village, owner_name)
values ('11111111-1111-1111-1111-111111111111',
        'Ferme Démo BoviTrack', 'Louga', 'Linguère', 'Dahra', 'Moussa Ba')
on conflict (id) do nothing;

-- Owners ------------------------------------------------------------
insert into public.owners (id, farm_id, full_name, phone, village) values
  ('b0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Moussa Ba','+221 77 845 19 30','Dahra'),
  ('b0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Ousmane Sow','+221 77 512 04 88','Tambacounda'),
  ('b0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Amadou Diallo','+221 76 207 41 65','Kaolack'),
  ('b0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Awa Ndiaye','+221 78 204 66 17','Thiès'),
  ('b0000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Cheikh Fall','+221 77 119 52 76','Linguère')
on conflict (id) do nothing;

-- 10 animals --------------------------------------------------------
insert into public.animals
  (id, farm_id, owner_id, animal_code, rfid_tag, qr_code, name, breed, sex, birth_year, color, status) values
  ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000001','SN-BOV-2026-0001','RFID-SN-784512','QR-SN-BOV-2026-0001','Fanta','Gobra','F',2021,'Robe blanche, bosse marquée','active'),
  ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000002','SN-BOV-2026-0002','RFID-SN-784513','QR-SN-BOV-2026-0002','Samba','Ndama','M',2020,'Robe fauve, cornes longues','active'),
  ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000003','SN-BOV-2026-0003','RFID-SN-784514','QR-SN-BOV-2026-0003','Penda','Djakoré','F',2022,'Robe pie noire','active'),
  ('a0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000004','SN-BOV-2026-0004','RFID-SN-784515','QR-SN-BOV-2026-0004','Demba','Montbéliarde','M',2019,'Robe pie rouge','active'),
  ('a0000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000005','SN-BOV-2026-0005','RFID-SN-784516','QR-SN-BOV-2026-0005','Khady','Gobra','F',2023,'Robe blanche tachetée','sold'),
  ('a0000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000001','SN-BOV-2026-0006','RFID-SN-784517','QR-SN-BOV-2026-0006','Yero','Guzerat','M',2021,'Robe grise, bosse haute','active'),
  ('a0000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000002','SN-BOV-2026-0007','RFID-SN-784518','QR-SN-BOV-2026-0007','Aïssata','Ndama','F',2020,'Robe fauve','active'),
  ('a0000000-0000-0000-0000-000000000008','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000004','SN-BOV-2026-0008','RFID-SN-784519','QR-SN-BOV-2026-0008','Maïmouna','Montbéliarde','F',2021,'Robe pie rouge','active'),
  ('a0000000-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000001','SN-BOV-2026-0009','RFID-SN-784520','QR-SN-BOV-2026-0009','Bineta','Guzerat','F',2020,'Robe grise','active'),
  ('a0000000-0000-0000-0000-000000000010','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000003','SN-BOV-2026-0010','RFID-SN-784521','QR-SN-BOV-2026-0010','Coumba','Djakoré','F',2022,'Robe pie noire','active')
on conflict (id) do nothing;

-- Locations (a few, incl. risk states) ------------------------------
insert into public.locations (id, animal_id, location_name, risk_status) values
  ('30000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Dahra — pâturage est','normale'),
  ('30000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002','Tambacounda — piste de Goudiry','alerte'),
  ('30000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003','Kaolack — parc central','sortie'),
  ('30000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000004','Thiès — dernière position connue','ancienne'),
  ('30000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000006','Matam — abords du fleuve','alerte')
on conflict (id) do nothing;

-- 3 security alerts -------------------------------------------------
insert into public.security_alerts (id, animal_id, alert_type, status, severity, last_known_location) values
  ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','vol','recherche','high','Tambacounda — piste de Goudiry'),
  ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000006','vol','nouvelle','critical','Matam — abords du fleuve'),
  ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004','vol','autorites','high','Thiès — marché de Khombole')
on conflict (id) do nothing;

-- 5 care records ----------------------------------------------------
insert into public.care_records (id, animal_id, diagnosis, treatment, veterinarian, status, date) values
  ('d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000003','Infection respiratoire','Antibiotique (5 jours) + repos','Dr Awa Ndiaye','urgent','2026-06-05'),
  ('d0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002','Boiterie patte avant droite','Anti-inflammatoire + repos','Dr Cheikh Fall','en_cours','2026-06-02'),
  ('d0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000006','Plaie ouverte au flanc','Désinfection + pansement','Dr Awa Ndiaye','suivi','2026-06-01'),
  ('d0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000004','Parasites externes (tiques)','Traitement acaricide','Ousmane Sow','termine','2026-05-20'),
  ('d0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000005','Fièvre légère','Antipyrétique + hydratation','Dr Awa Ndiaye','termine','2026-05-15')
on conflict (id) do nothing;

-- 5 vaccine records -------------------------------------------------
insert into public.vaccine_records (id, animal_id, vaccine_name, due_date, done_date, agent, batch_number, status) values
  ('e0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Vaccin PPCB','2026-09-01',null,'Dr Awa Ndiaye',null,'programme'),
  ('e0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002','Vaccin pasteurellose','2026-05-20',null,'Dr Cheikh Fall',null,'en_retard'),
  ('e0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000003','Vaccin PPCB','2026-06-08',null,'Amadou Diallo',null,'a_faire'),
  ('e0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000004','Déparasitage','2026-03-10','2026-03-10','Ousmane Sow','LOT-DEP-2026-B07','fait'),
  ('e0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000005','Vaccin PPCB','2026-03-18','2026-03-18','Dr Awa Ndiaye','LOT-PPCB-2026-A14','fait')
on conflict (id) do nothing;

-- 3 breeding records ------------------------------------------------
insert into public.breeding_records (id, female_animal_id, male_animal_id, status, expected_birth) values
  ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004','gestation','2026-08-15'),
  ('f0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000002','mise_bas_proche','2026-06-20'),
  ('f0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000002','gestation','2026-11-10')
on conflict (id) do nothing;

-- 2 birth records ---------------------------------------------------
insert into public.birth_records (id, calf_animal_id, mother_animal_id, breeding_id, birth_date, status) values
  ('12000000-0000-0000-0000-000000000001',null,'a0000000-0000-0000-0000-000000000009',null,'2026-06-02','enregistre'),
  ('12000000-0000-0000-0000-000000000002',null,'a0000000-0000-0000-0000-000000000005',null,'2026-06-04','a_enregistrer')
on conflict (id) do nothing;

-- 3 sale records ----------------------------------------------------
insert into public.sale_records (id, animal_id, seller_name, buyer_name, price_fcfa, market, status) values
  ('20000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000005','Cheikh Fall','Fatou Diop',375000,'Marché de Linguère','transfere'),
  ('20000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003','Amadou Diallo','Moussa Ba',250000,'Marché de Kaolack','negociation'),
  ('20000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004','Awa Ndiaye','Ibrahima Sarr',850000,'Marché de Thiès','paiement_attente')
on conflict (id) do nothing;

-- A few timeline events --------------------------------------------
insert into public.timeline_events (id, animal_id, event_type, description) values
  ('40000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','alert','Signalé manquant — alerte vol'),
  ('40000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','registered','Animal enregistré dans le cheptel'),
  ('40000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000005','sale','Vendu et transféré')
on conflict (id) do nothing;
