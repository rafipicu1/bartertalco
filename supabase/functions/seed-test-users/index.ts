import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEST_USERS = [
  { email: 'user1@domain.com', password: 'user1', username: 'andi_gadget', fullName: 'Andi Pratama', city: 'Jakarta Selatan', district: 'Kebayoran Baru', province: 'DKI Jakarta' },
  { email: 'user2@domain.com', password: 'user2', username: 'bella_fashion', fullName: 'Bella Sari', city: 'Jakarta Pusat', district: 'Menteng', province: 'DKI Jakarta' },
  { email: 'user3@domain.com', password: 'user3', username: 'chris_motor', fullName: 'Chris Wijaya', city: 'Tangerang', district: 'BSD City', province: 'Banten' },
  { email: 'user4@domain.com', password: 'user4', username: 'dina_elektronik', fullName: 'Dina Permata', city: 'Bekasi', district: 'Bekasi Selatan', province: 'Jawa Barat' },
  { email: 'user5@domain.com', password: 'user5', username: 'eko_gaming', fullName: 'Eko Saputra', city: 'Depok', district: 'Margonda', province: 'Jawa Barat' },
  { email: 'user6@domain.com', password: 'user6', username: 'fani_kamera', fullName: 'Fani Lestari', city: 'Jakarta Barat', district: 'Kebon Jeruk', province: 'DKI Jakarta' },
  { email: 'user7@domain.com', password: 'user7', username: 'gilang_otomotif', fullName: 'Gilang Ramadhan', city: 'Bogor', district: 'Bogor Tengah', province: 'Jawa Barat' },
  { email: 'user8@domain.com', password: 'user8', username: 'hana_lifestyle', fullName: 'Hana Putri', city: 'Jakarta Timur', district: 'Cakung', province: 'DKI Jakarta' },
  { email: 'user9@domain.com', password: 'user9', username: 'ivan_tech', fullName: 'Ivan Santoso', city: 'Tangerang Selatan', district: 'Pamulang', province: 'Banten' },
  { email: 'user10@domain.com', password: 'user10', username: 'julia_hobi', fullName: 'Julia Anggraini', city: 'Jakarta Utara', district: 'Kelapa Gading', province: 'DKI Jakarta' },
]

const ITEMS_BY_USER: Record<string, Array<{
  name: string;
  description: string;
  detailed_minus: string;
  photos: string[];
  category: string;
  estimated_value: number;
  barter_preference: string;
  top_up_value: number;
  condition: string;
}>> = {
  'andi_gadget': [
    { name: 'iPhone 15 Pro Max 256GB', description: 'iPhone 15 Pro Max Natural Titanium, fullset box. Battery health 98%.', detailed_minus: 'Ada goresan micro di frame', photos: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'], category: 'elektronik', estimated_value: 21000000, barter_preference: 'Samsung S24 Ultra atau MacBook', top_up_value: 0, condition: 'like_new' },
    { name: 'MacBook Air M2 256GB', description: 'MacBook Air M2 Midnight, RAM 8GB. Cycle count 50.', detailed_minus: 'Keyboard ada bekas sidik jari', photos: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'], category: 'elektronik', estimated_value: 15000000, barter_preference: 'iPad Pro atau gaming laptop', top_up_value: 0, condition: 'like_new' },
    { name: 'iPad Pro 12.9" M2', description: 'iPad Pro 12.9 inch M2, 256GB wifi + cellular. Lengkap Apple Pencil 2.', detailed_minus: 'Case agak kusam', photos: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'], category: 'elektronik', estimated_value: 16000000, barter_preference: 'MacBook atau kamera mirrorless', top_up_value: 500000, condition: 'good' },
    { name: 'Sony WH-1000XM5', description: 'Headphone wireless ANC terbaik. Battery 30 jam. Fullset box.', detailed_minus: 'Headband ada bekas pakai', photos: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800'], category: 'elektronik', estimated_value: 4500000, barter_preference: 'AirPods Max', top_up_value: 0, condition: 'like_new' },
    { name: 'DJI Mini 3 Pro', description: 'Drone DJI Mini 3 Pro fly more combo. Masih garansi 6 bulan.', detailed_minus: 'Baling-baling cadangan tinggal 2 set', photos: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800'], category: 'elektronik', estimated_value: 12000000, barter_preference: 'Kamera mirrorless Sony', top_up_value: 0, condition: 'good' },
    { name: 'Apple Watch Ultra 2', description: 'Apple Watch Ultra 2 titanium, lengkap 3 strap. Battery health 100%.', detailed_minus: 'Box agak penyok', photos: ['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800'], category: 'elektronik', estimated_value: 12500000, barter_preference: 'iPhone atau iPad', top_up_value: 0, condition: 'like_new' },
    { name: 'Samsung Galaxy Tab S9 Ultra', description: 'Tab S9 Ultra 256GB lengkap S Pen dan keyboard cover.', detailed_minus: 'Ada dead pixel 1 titik di pojok', photos: ['https://images.unsplash.com/photo-1632634909416-ed604f01f2a5?w=800'], category: 'elektronik', estimated_value: 14000000, barter_preference: 'iPad Pro atau laptop gaming', top_up_value: 0, condition: 'good' },
    { name: 'Nintendo Switch OLED', description: 'Switch OLED putih fullset. Include game Zelda TOTK & Mario Kart.', detailed_minus: 'Joycon drift ringan', photos: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800'], category: 'gaming', estimated_value: 5000000, barter_preference: 'PS5 controller atau game PS5', top_up_value: 0, condition: 'good' },
    { name: 'Logitech G Pro X Superlight 2', description: 'Mouse gaming wireless ultralight. Sensor terbaik di kelasnya.', detailed_minus: 'Kaki mouse sudah diganti aftermarket', photos: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'], category: 'gaming', estimated_value: 2200000, barter_preference: 'Keyboard mechanical', top_up_value: 0, condition: 'good' },
    { name: 'GoPro Hero 12 Black', description: 'Action camera GoPro Hero 12 lengkap accessories. Waterproof.', detailed_minus: 'Screen protector ada goresan', photos: ['https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800'], category: 'elektronik', estimated_value: 6500000, barter_preference: 'DJI Pocket atau kamera vlog', top_up_value: 0, condition: 'like_new' },
  ],
  'bella_fashion': [
    { name: 'Tas Louis Vuitton Neverfull MM', description: 'LV Neverfull MM Damier Ebene authentic. Lengkap dustbag & receipt.', detailed_minus: 'Handle ada patina natural', photos: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'], category: 'fashion', estimated_value: 18000000, barter_preference: 'Tas Chanel atau Hermes', top_up_value: 0, condition: 'good' },
    { name: 'Sepatu Gucci Ace Sneakers', description: 'Gucci Ace bee original size 39. Jarang pakai, kondisi 95%.', detailed_minus: 'Sol ada bekas pakai sedikit', photos: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'], category: 'fashion', estimated_value: 8500000, barter_preference: 'Sepatu branded lain', top_up_value: 0, condition: 'like_new' },
    { name: 'Jam Tangan Cartier Tank', description: 'Cartier Tank Solo quartz steel. Lengkap box & papers.', detailed_minus: 'Strap kulit perlu diganti', photos: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800'], category: 'fashion', estimated_value: 45000000, barter_preference: 'Rolex atau Omega', top_up_value: 5000000, condition: 'good' },
    { name: 'Kacamata Dior So Real', description: 'Dior So Real sunglasses authentic. Lengkap case original.', detailed_minus: 'Ada goresan halus di lensa', photos: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800'], category: 'fashion', estimated_value: 5500000, barter_preference: 'Kacamata Celine atau Chanel', top_up_value: 0, condition: 'good' },
    { name: 'Dompet Prada Saffiano', description: 'Prada Saffiano long wallet black. Authentic dengan card.', detailed_minus: 'Resleting agak seret', photos: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'], category: 'fashion', estimated_value: 6000000, barter_preference: 'Dompet LV atau Gucci', top_up_value: 0, condition: 'good' },
    { name: 'Jaket Moncler Padded', description: 'Moncler puffer jacket size M. Perfect untuk traveling.', detailed_minus: 'Tag dalam agak pudar', photos: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'], category: 'fashion', estimated_value: 15000000, barter_preference: 'Jaket Canada Goose', top_up_value: 0, condition: 'like_new' },
    { name: 'Sepatu Jimmy Choo Heels', description: 'Jimmy Choo Anouk pumps size 38. Worn once for wedding.', detailed_minus: 'Sol bawah ada bekas pakai', photos: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'], category: 'fashion', estimated_value: 7000000, barter_preference: 'Sepatu Manolo atau Louboutin', top_up_value: 0, condition: 'like_new' },
    { name: 'Ikat Pinggang Hermes H', description: 'Hermes H belt reversible black/brown. Size 85.', detailed_minus: 'Buckle ada goresan micro', photos: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800'], category: 'fashion', estimated_value: 12000000, barter_preference: 'Belt Gucci atau LV', top_up_value: 0, condition: 'good' },
    { name: 'Scarf Burberry Classic', description: 'Burberry classic check cashmere scarf. 100% authentic.', detailed_minus: 'Ada tarikan benang kecil', photos: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800'], category: 'fashion', estimated_value: 5000000, barter_preference: 'Scarf Hermes', top_up_value: 0, condition: 'good' },
    { name: 'Tas Bottega Veneta Pouch', description: 'BV The Pouch clutch intrecciato leather. Kondisi mint.', detailed_minus: 'Dustbag hilang', photos: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'], category: 'fashion', estimated_value: 25000000, barter_preference: 'Tas Celine atau Loewe', top_up_value: 0, condition: 'like_new' },
  ],
  'chris_motor': [
    { name: 'Yamaha NMAX 2022', description: 'NMAX 155 connected ABS. Km 8000. Pajak hidup. Modif minimalis.', detailed_minus: 'Body ada baret halus', photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'], category: 'kendaraan', estimated_value: 28000000, barter_preference: 'PCX 160 atau Vespa', top_up_value: 0, condition: 'good' },
    { name: 'Honda PCX 160 2023', description: 'PCX 160 CBS putih. Km 3000. Garansi masih aktif.', detailed_minus: 'Spion ganti aftermarket', photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'], category: 'kendaraan', estimated_value: 32000000, barter_preference: 'Aerox atau XMAX', top_up_value: 0, condition: 'like_new' },
    { name: 'Vespa Sprint 150', description: 'Vespa Sprint i-get 2021. Km 12000. Warna hijau mint.', detailed_minus: 'Jok perlu dirapikan', photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'], category: 'kendaraan', estimated_value: 35000000, barter_preference: 'Motor matic lain atau mobil bekas', top_up_value: 5000000, condition: 'good' },
    { name: 'Helm AGV Pista GP RR', description: 'AGV Pista GP RR Rossi Winter Test. Size M. Rare item.', detailed_minus: 'Visor ada goresan micro', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'olahraga', estimated_value: 15000000, barter_preference: 'Helm Shoei atau Arai', top_up_value: 0, condition: 'good' },
    { name: 'Jaket Dainese Racing', description: 'Dainese Super Speed 4 leather jacket size 50. Like new.', detailed_minus: 'Back protector tidak include', photos: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'], category: 'olahraga', estimated_value: 8000000, barter_preference: 'Jaket Alpinestars', top_up_value: 0, condition: 'like_new' },
    { name: 'GoPro Hero 11 + Mounting Kit', description: 'GoPro untuk motovlog. Lengkap chin mount & accessories.', detailed_minus: 'Battery mulai drop', photos: ['https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800'], category: 'elektronik', estimated_value: 5500000, barter_preference: 'Insta360 atau DJI Action', top_up_value: 0, condition: 'good' },
    { name: 'Sarung Tangan Alpinestars GP Pro', description: 'Alpinestars GP Pro R3 gloves size L. Race spec.', detailed_minus: 'Velcro agak kendor', photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'], category: 'olahraga', estimated_value: 3500000, barter_preference: 'Gloves Dainese', top_up_value: 0, condition: 'good' },
    { name: 'Sepatu Dainese Axial D1', description: 'Racing boots Dainese Axial size 43. Kondisi 90%.', detailed_minus: 'Toe slider perlu diganti', photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'], category: 'olahraga', estimated_value: 6000000, barter_preference: 'Boots Alpinestars Supertech R', top_up_value: 0, condition: 'good' },
    { name: 'Intercom Cardo Packtalk Bold', description: 'Intercom Cardo Packtalk Bold JBL. Mesh network.', detailed_minus: 'Mounting base hilang 1', photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'], category: 'elektronik', estimated_value: 4000000, barter_preference: 'Sena 50S', top_up_value: 0, condition: 'good' },
    { name: 'Knalpot Akrapovic Slip-On', description: 'Akrapovic slip-on untuk NMAX. Full stainless. Suara mantap.', detailed_minus: 'Ada bekas panas di body', photos: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800'], category: 'kendaraan', estimated_value: 5500000, barter_preference: 'Knalpot Yoshimura atau Arrow', top_up_value: 0, condition: 'good' },
  ],
  'dina_elektronik': [
    { name: 'Samsung Galaxy S24 Ultra', description: 'S24 Ultra 512GB Titanium Black. Garansi SEIN 10 bulan.', detailed_minus: 'Layar ada goresan micro', photos: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'], category: 'elektronik', estimated_value: 18000000, barter_preference: 'iPhone 15 Pro Max', top_up_value: 0, condition: 'like_new' },
    { name: 'Samsung Galaxy Z Fold 5', description: 'Z Fold 5 256GB cream. Lengkap S Pen fold edition.', detailed_minus: 'Crease normal di layar dalam', photos: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'], category: 'elektronik', estimated_value: 22000000, barter_preference: 'MacBook Pro atau iPhone + iPad', top_up_value: 0, condition: 'good' },
    { name: 'Samsung Galaxy Watch 6 Classic', description: 'Watch 6 Classic 47mm silver LTE. Fullset box.', detailed_minus: 'Strap original hilang', photos: ['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800'], category: 'elektronik', estimated_value: 5500000, barter_preference: 'Apple Watch', top_up_value: 0, condition: 'good' },
    { name: 'Samsung Galaxy Buds 2 Pro', description: 'Buds 2 Pro graphite. ANC mantap. Battery health 95%.', detailed_minus: 'Case ada goresan', photos: ['https://images.unsplash.com/photo-1590658165737-15a047b7c0b0?w=800'], category: 'elektronik', estimated_value: 2000000, barter_preference: 'AirPods Pro 2', top_up_value: 0, condition: 'good' },
    { name: 'TV Samsung Neo QLED 55"', description: 'Neo QLED QN85A 55 inch. 4K 120Hz. Perfect untuk gaming.', detailed_minus: 'Remote original hilang', photos: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'], category: 'elektronik', estimated_value: 15000000, barter_preference: 'LG OLED atau Sony Bravia', top_up_value: 0, condition: 'good' },
    { name: 'Soundbar Samsung HW-Q990B', description: 'Soundbar 11.1.4ch Dolby Atmos. Subwoofer wireless.', detailed_minus: 'Box tidak ada', photos: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800'], category: 'elektronik', estimated_value: 12000000, barter_preference: 'Sonos Arc atau Bose', top_up_value: 0, condition: 'like_new' },
    { name: 'Laptop Samsung Galaxy Book3 Pro', description: 'Galaxy Book3 Pro 14 inch i7 16GB 512GB. Ringan 1.17kg.', detailed_minus: 'Charger bukan original', photos: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'], category: 'elektronik', estimated_value: 16000000, barter_preference: 'MacBook Air M2 atau Dell XPS', top_up_value: 0, condition: 'good' },
    { name: 'Vacuum Samsung Jet Bot+', description: 'Robot vacuum dengan docking station. Self emptying.', detailed_minus: 'Brush perlu diganti', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'perlengkapan_rumah', estimated_value: 8000000, barter_preference: 'Roborock atau Dyson', top_up_value: 0, condition: 'good' },
    { name: 'Kulkas Samsung Bespoke', description: 'Kulkas 2 pintu Bespoke 345L. Warna navy. Hemat listrik.', detailed_minus: 'Handle ada goresan', photos: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800'], category: 'perlengkapan_rumah', estimated_value: 12000000, barter_preference: 'Kulkas LG atau Hitachi', top_up_value: 0, condition: 'good' },
    { name: 'AC Samsung WindFree 1.5PK', description: 'AC inverter WindFree. Dingin tanpa angin langsung.', detailed_minus: 'Perlu cuci AC', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'perlengkapan_rumah', estimated_value: 7000000, barter_preference: 'AC Daikin atau Panasonic', top_up_value: 0, condition: 'good' },
  ],
  'eko_gaming': [
    { name: 'PlayStation 5 Disc Edition', description: 'PS5 disc fullset 2 controller. Game FIFA 24 & Spider-Man 2.', detailed_minus: 'Disc drive agak berisik', photos: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800'], category: 'gaming', estimated_value: 8500000, barter_preference: 'Xbox Series X atau gaming PC', top_up_value: 0, condition: 'good' },
    { name: 'Xbox Series X', description: 'Xbox Series X 1TB. Include Game Pass Ultimate 6 bulan.', detailed_minus: 'Controller analog kanan agak drift', photos: ['https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800'], category: 'gaming', estimated_value: 7500000, barter_preference: 'PS5 atau Nintendo Switch OLED', top_up_value: 0, condition: 'good' },
    { name: 'Gaming PC RTX 4070', description: 'PC Gaming i5-13600K + RTX 4070 12GB + 32GB RAM + 1TB SSD.', detailed_minus: 'Case ada dent kecil', photos: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800'], category: 'gaming', estimated_value: 22000000, barter_preference: 'Laptop gaming high-end', top_up_value: 0, condition: 'good' },
    { name: 'Monitor Gaming ASUS ROG 27"', description: 'ROG Swift PG279QM 27" 1440p 240Hz. G-Sync Ultimate.', detailed_minus: 'Stand original hilang', photos: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'], category: 'gaming', estimated_value: 9000000, barter_preference: 'Monitor LG OLED atau Samsung Odyssey', top_up_value: 0, condition: 'good' },
    { name: 'Kursi Gaming Secretlab Titan', description: 'Secretlab Titan Evo 2022 size R. Warna stealth.', detailed_minus: 'Arm rest kiri agak longgar', photos: ['https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800'], category: 'gaming', estimated_value: 6500000, barter_preference: 'Herman Miller atau Razer Iskur', top_up_value: 0, condition: 'good' },
    { name: 'Keyboard Wooting 60HE', description: 'Wooting 60HE rapid trigger. Gateron Lekker switch.', detailed_minus: 'Keycaps ganti custom', photos: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800'], category: 'gaming', estimated_value: 4500000, barter_preference: 'Razer Huntsman V3 Pro', top_up_value: 0, condition: 'like_new' },
    { name: 'Headset SteelSeries Arctis Nova Pro', description: 'Arctis Nova Pro Wireless. DAC hi-res. ANC.', detailed_minus: 'Ear cushion perlu diganti', photos: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800'], category: 'gaming', estimated_value: 4000000, barter_preference: 'Astro A50 atau Logitech G Pro X 2', top_up_value: 0, condition: 'good' },
    { name: 'Steam Deck OLED 512GB', description: 'Steam Deck OLED 512GB. Lengkap case & dock.', detailed_minus: 'Screen protector ada bubble', photos: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800'], category: 'gaming', estimated_value: 9500000, barter_preference: 'ROG Ally atau Legion Go', top_up_value: 0, condition: 'like_new' },
    { name: 'VR Meta Quest 3 128GB', description: 'Quest 3 128GB + Elite strap + case. Standalone VR terbaik.', detailed_minus: 'Controller ada bekas pakai', photos: ['https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800'], category: 'gaming', estimated_value: 7500000, barter_preference: 'PSVR 2', top_up_value: 0, condition: 'good' },
    { name: 'Flight Sim Thrustmaster T.16000M', description: 'HOTAS setup Thrustmaster T.16000M + throttle. Untuk flight sim.', detailed_minus: 'Kabel extension tidak include', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'gaming', estimated_value: 3500000, barter_preference: 'Logitech X56 atau racing wheel', top_up_value: 0, condition: 'good' },
  ],
  'fani_kamera': [
    { name: 'Sony A7IV Body Only', description: 'Sony A7 IV mirrorless fullframe. Shutter count 5000.', detailed_minus: 'Body ada lecet normal', photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'], category: 'elektronik', estimated_value: 28000000, barter_preference: 'Canon R6 II atau Nikon Z6 III', top_up_value: 0, condition: 'good' },
    { name: 'Sony 24-70mm f/2.8 GM II', description: 'Lensa Sony GM II 24-70 f2.8. Optik terbaik di kelasnya.', detailed_minus: 'Filter UV termasuk', photos: ['https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800'], category: 'elektronik', estimated_value: 30000000, barter_preference: 'Lensa prime Sony GM', top_up_value: 0, condition: 'like_new' },
    { name: 'Sony 85mm f/1.4 GM', description: 'Lensa portrait terbaik Sony 85mm f1.4 GM. Bokeh creamy.', detailed_minus: 'Hood ada goresan', photos: ['https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800'], category: 'elektronik', estimated_value: 22000000, barter_preference: 'Sony 135mm GM atau Sigma Art', top_up_value: 0, condition: 'good' },
    { name: 'DJI RS 3 Pro', description: 'Gimbal DJI RS 3 Pro combo. Include focus motor & lidar.', detailed_minus: 'Carry case robek kecil', photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'], category: 'elektronik', estimated_value: 12000000, barter_preference: 'Zhiyun Crane 4 atau lighting kit', top_up_value: 0, condition: 'good' },
    { name: 'Godox AD600 Pro', description: 'Flash strobe Godox AD600 Pro + softbox 120cm.', detailed_minus: 'Battery 2 unit agak drop', photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'], category: 'elektronik', estimated_value: 15000000, barter_preference: 'Profoto B10 atau lighting studio', top_up_value: 0, condition: 'good' },
    { name: 'Tripod Gitzo GT3543LS', description: 'Tripod carbon fiber Gitzo systematic. Load capacity 21kg.', detailed_minus: 'Leg lock perlu diservis', photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'], category: 'elektronik', estimated_value: 12000000, barter_preference: 'Really Right Stuff atau Peak Design', top_up_value: 0, condition: 'good' },
    { name: 'Monitor Atomos Ninja V+', description: 'Recorder monitor Atomos Ninja V+ 8K. HDR 1000nit.', detailed_minus: 'Screen ada bekas sidik jari', photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'], category: 'elektronik', estimated_value: 10000000, barter_preference: 'SmallHD atau Blackmagic', top_up_value: 0, condition: 'good' },
    { name: 'Backpack Peak Design 45L', description: 'Tas kamera Peak Design Travel 45L. Modular system.', detailed_minus: 'Zipper agak seret', photos: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'], category: 'elektronik', estimated_value: 5000000, barter_preference: 'Lowepro atau F-Stop', top_up_value: 0, condition: 'good' },
    { name: 'Insta360 X4', description: 'Kamera 360 8K Insta360 X4. Perfect untuk VR content.', detailed_minus: 'Lens guard perlu diganti', photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'], category: 'elektronik', estimated_value: 8000000, barter_preference: 'GoPro Max 2 atau DJI', top_up_value: 0, condition: 'good' },
    { name: 'Sigma 35mm f/1.4 DG DN Art', description: 'Lensa Sigma 35mm Art untuk Sony E-mount. Sharpness luar biasa.', detailed_minus: 'Box tidak ada', photos: ['https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800'], category: 'elektronik', estimated_value: 12000000, barter_preference: 'Sony 35mm GM atau lensa wide lain', top_up_value: 0, condition: 'like_new' },
  ],
  'gilang_otomotif': [
    { name: 'Toyota Avanza 1.5 G 2021', description: 'Avanza 1.5 G MT. Km 25000. Service record resmi. Pajak panjang.', detailed_minus: 'Body ada baret halus di pintu', photos: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'], category: 'kendaraan', estimated_value: 185000000, barter_preference: 'Xpander atau Rush', top_up_value: 0, condition: 'good' },
    { name: 'Honda Brio RS 2022', description: 'Brio RS CVT putih. Km 15000. Tangan pertama. Full ori.', detailed_minus: 'Kaca film perlu diganti', photos: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'], category: 'kendaraan', estimated_value: 175000000, barter_preference: 'Jazz RS atau Yaris', top_up_value: 0, condition: 'like_new' },
    { name: 'Velg Rays Volk Racing TE37', description: 'Velg Rays TE37 SL 17x8 +40. Authentic Japan. 4 pcs.', detailed_minus: 'Ada curb rash 1 velg', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'kendaraan', estimated_value: 25000000, barter_preference: 'Velg Work atau BBS', top_up_value: 0, condition: 'good' },
    { name: 'Dashcam Blackvue DR900X', description: 'Dashcam Blackvue DR900X 2ch 4K. Cloud connected.', detailed_minus: 'Mounting tape perlu diganti', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'elektronik', estimated_value: 8000000, barter_preference: 'Thinkware atau Viofo', top_up_value: 0, condition: 'good' },
    { name: 'Head Unit Android Asuka', description: 'Head unit Asuka AK-2000 10 inch. Carplay & Android Auto.', detailed_minus: 'GPS antenna hilang', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'kendaraan', estimated_value: 4500000, barter_preference: 'Pioneer atau Kenwood', top_up_value: 0, condition: 'good' },
    { name: 'Subwoofer JL Audio 12W6v3', description: 'Subwoofer JL Audio 12 inch + box custom. Bass mantap.', detailed_minus: 'Karpet box agak kusam', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'kendaraan', estimated_value: 7000000, barter_preference: 'Subwoofer Rockford atau Focal', top_up_value: 0, condition: 'good' },
    { name: 'Coilover Tein Flex Z', description: 'Coilover Tein Flex Z untuk Honda Jazz/City. Adjustable.', detailed_minus: 'Perlu rebuild', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'kendaraan', estimated_value: 8000000, barter_preference: 'BC Racing atau KW', top_up_value: 0, condition: 'good' },
    { name: 'Kunci Snap-on Professional Set', description: 'Tool set Snap-on 150 pcs. Professional grade.', detailed_minus: 'Beberapa socket hilang', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'kantor_industri', estimated_value: 15000000, barter_preference: 'Tool set MAC atau Matco', top_up_value: 0, condition: 'good' },
    { name: 'Compressor Lakoni 3HP', description: 'Compressor udara Lakoni 3HP 100L. Perfect untuk bengkel.', detailed_minus: 'Roda perlu diganti', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'kantor_industri', estimated_value: 5000000, barter_preference: 'Compressor Puma atau Swan', top_up_value: 0, condition: 'good' },
    { name: 'Car Lift 2 Post Rotary', description: 'Lift mobil 2 post Rotary 4 ton. Cocok untuk bengkel.', detailed_minus: 'Hydraulic perlu ganti seal', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'kantor_industri', estimated_value: 35000000, barter_preference: 'Mobil atau motor', top_up_value: 0, condition: 'good' },
  ],
  'hana_lifestyle': [
    { name: 'Dyson V15 Detect', description: 'Vacuum cordless Dyson V15 Detect. Laser particle detection.', detailed_minus: 'Battery sudah 2 tahun', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'perlengkapan_rumah', estimated_value: 9000000, barter_preference: 'Dyson tipe lain atau Roborock', top_up_value: 0, condition: 'good' },
    { name: 'Nespresso Vertuo Plus', description: 'Coffee machine Nespresso Vertuo Plus. Include 50 pods.', detailed_minus: 'Water tank ada goresan', photos: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'], category: 'perlengkapan_rumah', estimated_value: 3500000, barter_preference: 'Breville atau De Longhi', top_up_value: 0, condition: 'good' },
    { name: 'KitchenAid Artisan Mixer', description: 'Stand mixer KitchenAid 5qt. Warna empire red. Lengkap attachment.', detailed_minus: 'Bowl ada scratch', photos: ['https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=800'], category: 'perlengkapan_rumah', estimated_value: 8000000, barter_preference: 'Smeg atau Kenwood', top_up_value: 0, condition: 'good' },
    { name: 'Air Fryer Philips XXL', description: 'Air fryer Philips Airfryer XXL. Kapasitas besar untuk keluarga.', detailed_minus: 'Basket coating mulai mengelupas', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'perlengkapan_rumah', estimated_value: 3000000, barter_preference: 'Ninja atau Tefal', top_up_value: 0, condition: 'good' },
    { name: 'Sofa IKEA Kivik 3-Seat', description: 'Sofa IKEA Kivik 3 dudukan. Warna abu-abu. Cover bisa dicuci.', detailed_minus: 'Busa agak kempes', photos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'], category: 'perlengkapan_rumah', estimated_value: 8000000, barter_preference: 'Sofa Informa atau custom', top_up_value: 0, condition: 'good' },
    { name: 'TV LG OLED 55" C3', description: 'LG OLED55C3 4K 120Hz. Webos smart TV. HDR Dolby Vision.', detailed_minus: 'Bekas burn-in sangat tipis', photos: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'], category: 'elektronik', estimated_value: 18000000, barter_preference: 'Sony Bravia OLED atau Samsung QLED', top_up_value: 0, condition: 'good' },
    { name: 'Treadmill NordicTrack', description: 'Treadmill NordicTrack Commercial 1750. iFit compatible.', detailed_minus: 'Belt perlu dilubrikasi', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'olahraga', estimated_value: 25000000, barter_preference: 'Elliptical atau home gym', top_up_value: 0, condition: 'good' },
    { name: 'Sepeda Brompton M6L', description: 'Sepeda lipat Brompton M6L. Warna racing green. Jarang pakai.', detailed_minus: 'Saddle bukan original', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'olahraga', estimated_value: 35000000, barter_preference: 'Motor matic atau gadget', top_up_value: 0, condition: 'like_new' },
    { name: 'Piano Digital Roland FP-30X', description: 'Piano digital Roland FP-30X 88 keys. Include stand & pedal.', detailed_minus: 'Ada key yang agak keras', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'musik', estimated_value: 9000000, barter_preference: 'Yamaha atau Kawai digital piano', top_up_value: 0, condition: 'good' },
    { name: 'Yoga Mat Manduka PRO', description: 'Yoga mat Manduka PRO 6mm. Warna black magic. Lifetime warranty.', detailed_minus: 'Ada bekas marker kecil', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'olahraga', estimated_value: 2000000, barter_preference: 'Yoga props atau fitness equipment', top_up_value: 0, condition: 'good' },
  ],
  'ivan_tech': [
    { name: 'ASUS ROG Zephyrus G14 2024', description: 'Laptop gaming ROG G14 Ryzen 9 + RTX 4060. RAM 32GB.', detailed_minus: 'Keyboard backlight 1 tombol mati', photos: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'], category: 'elektronik', estimated_value: 25000000, barter_preference: 'MacBook Pro atau Razer Blade', top_up_value: 0, condition: 'good' },
    { name: 'Monitor LG 27GP950 4K 144Hz', description: 'Monitor gaming LG 27 inch 4K Nano IPS. HDMI 2.1 untuk PS5.', detailed_minus: 'Dead pixel 1 di pojok', photos: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'], category: 'elektronik', estimated_value: 12000000, barter_preference: 'Monitor OLED atau ultrawide', top_up_value: 0, condition: 'good' },
    { name: 'NAS Synology DS920+', description: 'NAS 4-bay Synology DS920+ dengan 4x4TB HDD. Perfect untuk backup.', detailed_minus: '1 HDD mulai ada bad sector', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'elektronik', estimated_value: 12000000, barter_preference: 'QNAP atau server', top_up_value: 0, condition: 'good' },
    { name: 'Router ASUS ROG Rapture', description: 'Router gaming ASUS ROG Rapture GT-AXE16000. WiFi 6E.', detailed_minus: 'Antenna 1 patah (masih work)', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'elektronik', estimated_value: 8000000, barter_preference: 'Ubiquiti atau Netgear', top_up_value: 0, condition: 'good' },
    { name: 'Mechanical Keyboard Custom', description: 'Custom keyboard 65% alu case. GMK keycaps. Gateron Oil King.', detailed_minus: 'Stabilizer perlu tune ulang', photos: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800'], category: 'elektronik', estimated_value: 5000000, barter_preference: 'Keychron Q atau Mode', top_up_value: 0, condition: 'good' },
    { name: 'Raspberry Pi 5 Kit Complete', description: 'Raspberry Pi 5 8GB + case + heatsink + power + SSD.', detailed_minus: 'Box original hilang', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'elektronik', estimated_value: 2500000, barter_preference: 'Arduino atau elektronik lain', top_up_value: 0, condition: 'like_new' },
    { name: 'UPS APC Smart-UPS 1500VA', description: 'UPS APC 1500VA LCD. Battery baru ganti 3 bulan.', detailed_minus: 'Casing ada goresan', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'elektronik', estimated_value: 4000000, barter_preference: 'UPS Eaton atau CyberPower', top_up_value: 0, condition: 'good' },
    { name: '3D Printer Bambu Lab P1S', description: '3D Printer Bambu Lab P1S enclosed. Lengkap AMS 4 color.', detailed_minus: 'Nozzle perlu diganti', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'elektronik', estimated_value: 12000000, barter_preference: 'Prusa atau Voron', top_up_value: 0, condition: 'good' },
    { name: 'Soldering Station Hakko FX-951', description: 'Soldering station Hakko FX-951. Include tips set.', detailed_minus: 'Holder agak kendor', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'elektronik', estimated_value: 3500000, barter_preference: 'JBC atau Weller', top_up_value: 0, condition: 'good' },
    { name: 'Oscilloscope Rigol DS1054Z', description: 'Oscilloscope Rigol DS1054Z 50MHz (unlocked 100MHz). 4 channel.', detailed_minus: 'Probe 1 agak kendor', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'elektronik', estimated_value: 6000000, barter_preference: 'Siglent atau multimeter Fluke', top_up_value: 0, condition: 'good' },
  ],
  'julia_hobi': [
    { name: 'Gundam PG Unicorn Full Armor', description: 'Perfect Grade Unicorn Gundam Full Armor. Sudah rakit + LED.', detailed_minus: 'Beberapa armor mark hilang', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'hobi_koleksi', estimated_value: 5000000, barter_preference: 'PG lain atau MG Hi-Nu Ver.Ka', top_up_value: 0, condition: 'good' },
    { name: 'Hot Toys Iron Man Mark 85', description: 'Hot Toys MMS528D30 Iron Man Mark LXXXV. Diecast version.', detailed_minus: 'Light up tidak berfungsi', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'hobi_koleksi', estimated_value: 6500000, barter_preference: 'Hot Toys Marvel lain', top_up_value: 0, condition: 'good' },
    { name: 'LEGO Millennium Falcon UCS', description: 'LEGO Star Wars UCS Millennium Falcon 75192. Sudah rakit display.', detailed_minus: 'Beberapa piece minor hilang', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'hobi_koleksi', estimated_value: 12000000, barter_preference: 'LEGO UCS lain atau Star Wars collectible', top_up_value: 0, condition: 'good' },
    { name: 'Pokemon Card Charizard VMAX', description: 'Pokemon TCG Charizard VMAX Rainbow Secret Rare. PSA 9.', detailed_minus: 'Case ada goresan micro', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'hobi_koleksi', estimated_value: 8000000, barter_preference: 'Pokemon card rare lain', top_up_value: 0, condition: 'like_new' },
    { name: 'Manga One Piece Box Set 1-23', description: 'One Piece manga vol 1-23 English box set. Kondisi bagus.', detailed_minus: 'Box agak penyok', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'hobi_koleksi', estimated_value: 2500000, barter_preference: 'Manga box set lain', top_up_value: 0, condition: 'good' },
    { name: 'Vinyl Record Player Audio Technica', description: 'Turntable Audio Technica AT-LP120X. Direct drive. DJ ready.', detailed_minus: 'Stylus perlu diganti', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'musik', estimated_value: 4500000, barter_preference: 'Turntable Pro-Ject atau Rega', top_up_value: 0, condition: 'good' },
    { name: 'Gitar Fender Player Stratocaster', description: 'Gitar elektrik Fender Player Strat. Made in Mexico. Sunburst.', detailed_minus: 'Fret ada wear minimal', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'musik', estimated_value: 12000000, barter_preference: 'Gibson atau PRS', top_up_value: 0, condition: 'good' },
    { name: 'Amplifier Marshall DSL40CR', description: 'Tube amp Marshall DSL40CR 40W. Suara British rock klasik.', detailed_minus: 'Tolex ada sobek kecil', photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'], category: 'musik', estimated_value: 8000000, barter_preference: 'Fender atau Vox tube amp', top_up_value: 0, condition: 'good' },
    { name: 'Kamera Analog Contax T2', description: 'Kamera film Contax T2 titanium. Zeiss lens. Collector item.', detailed_minus: 'LCD ada pixel mati', photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'], category: 'hobi_koleksi', estimated_value: 25000000, barter_preference: 'Leica atau Hasselblad', top_up_value: 0, condition: 'good' },
    { name: 'Sneakers Air Jordan 1 Travis Scott', description: 'Nike Air Jordan 1 x Travis Scott Mocha. DS size 42.5. Authenticated.', detailed_minus: 'Box replacement', photos: ['https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800'], category: 'fashion', estimated_value: 25000000, barter_preference: 'Sneakers hype lain atau watch', top_up_value: 0, condition: 'new' },
  ],
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results: Array<{email: string; status: string; error?: string}> = []

    for (const user of TEST_USERS) {
      console.log(`Creating user: ${user.email}`)
      
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === user.email)
      
      let userId: string

      if (existingUser) {
        console.log(`User ${user.email} already exists, using existing ID`)
        userId = existingUser.id
      } else {
        // Create user with admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            username: user.username,
            full_name: user.fullName,
            location: `${user.city} — ${user.district}`,
            province: user.province,
            city: user.city,
            district: user.district
          }
        })

        if (authError) {
          console.error(`Error creating user ${user.email}:`, authError)
          results.push({ email: user.email, status: 'error', error: authError.message })
          continue
        }

        if (!authData.user) {
          results.push({ email: user.email, status: 'error', error: 'No user data returned' })
          continue
        }

        userId = authData.user.id
        console.log(`User created with ID: ${userId}`)
      }


      // Create profile manually (trigger may not work with admin API)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          username: user.username,
          full_name: user.fullName,
          city: user.city,
          district: user.district,
          province: user.province,
          location: `${user.city} — ${user.district}`
        })

      if (profileError) {
        console.error(`Error creating profile for ${user.email}:`, profileError)
        results.push({ email: user.email, status: 'error', error: profileError.message })
        continue
      }

      console.log(`Profile created for ${user.email}`)

      // Delete existing dummy items (if any)
      await supabaseAdmin
        .from('items')
        .delete()
        .eq('user_id', userId)

      // Insert 10 items for this user
      const userItems = ITEMS_BY_USER[user.username] || ITEMS_BY_USER['andi_gadget']
      
      for (const item of userItems) {
        const { error: itemError } = await supabaseAdmin
          .from('items')
          .insert({
            user_id: userId,
            name: item.name,
            description: item.description,
            detailed_minus: item.detailed_minus,
            photos: item.photos,
            category: item.category,
            estimated_value: item.estimated_value,
            barter_preference: item.barter_preference,
            top_up_value: item.top_up_value,
            condition: item.condition,
            location: `${user.city} — ${user.district}`,
            province: user.province,
            city: user.city,
            district: user.district,
            is_active: true
          })

        if (itemError) {
          console.error(`Error inserting item for ${user.email}:`, itemError)
        }
      }

      console.log(`Inserted ${userItems.length} items for user ${user.email}`)
      results.push({ email: user.email, status: 'success' })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Seeding complete',
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in seed function:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
