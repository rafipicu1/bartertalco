// Indonesian Location Data - Province → City → District (Kecamatan)
// This is a simplified dataset. In production, consider using an API or larger dataset.

export interface District {
  name: string;
}

export interface City {
  name: string;
  districts: District[];
}

export interface Province {
  name: string;
  cities: City[];
}

export const INDONESIA_LOCATIONS: Province[] = [
  {
    name: "DKI Jakarta",
    cities: [
      {
        name: "Jakarta Selatan",
        districts: [
          { name: "Kebayoran Baru" },
          { name: "Kebayoran Lama" },
          { name: "Pesanggrahan" },
          { name: "Cilandak" },
          { name: "Pasar Minggu" },
          { name: "Jagakarsa" },
          { name: "Mampang Prapatan" },
          { name: "Pancoran" },
          { name: "Tebet" },
          { name: "Setiabudi" },
        ],
      },
      {
        name: "Jakarta Pusat",
        districts: [
          { name: "Tanah Abang" },
          { name: "Menteng" },
          { name: "Senen" },
          { name: "Johar Baru" },
          { name: "Cempaka Putih" },
          { name: "Kemayoran" },
          { name: "Sawah Besar" },
          { name: "Gambir" },
        ],
      },
      {
        name: "Jakarta Barat",
        districts: [
          { name: "Kebon Jeruk" },
          { name: "Palmerah" },
          { name: "Grogol Petamburan" },
          { name: "Taman Sari" },
          { name: "Tambora" },
          { name: "Cengkareng" },
          { name: "Kalideres" },
          { name: "Kembangan" },
        ],
      },
      {
        name: "Jakarta Timur",
        districts: [
          { name: "Matraman" },
          { name: "Pulo Gadung" },
          { name: "Jatinegara" },
          { name: "Duren Sawit" },
          { name: "Kramat Jati" },
          { name: "Makasar" },
          { name: "Pasar Rebo" },
          { name: "Ciracas" },
          { name: "Cipayung" },
          { name: "Cakung" },
        ],
      },
      {
        name: "Jakarta Utara",
        districts: [
          { name: "Penjaringan" },
          { name: "Pademangan" },
          { name: "Tanjung Priok" },
          { name: "Koja" },
          { name: "Kelapa Gading" },
          { name: "Cilincing" },
        ],
      },
    ],
  },
  {
    name: "Jawa Barat",
    cities: [
      {
        name: "Bandung",
        districts: [
          { name: "Coblong" },
          { name: "Dago" },
          { name: "Cicendo" },
          { name: "Sukajadi" },
          { name: "Cidadap" },
          { name: "Bandung Wetan" },
          { name: "Sumur Bandung" },
          { name: "Cibeunying Kidul" },
          { name: "Cibeunying Kaler" },
          { name: "Antapani" },
        ],
      },
      {
        name: "Bekasi",
        districts: [
          { name: "Bekasi Barat" },
          { name: "Bekasi Timur" },
          { name: "Bekasi Selatan" },
          { name: "Bekasi Utara" },
          { name: "Medan Satria" },
          { name: "Rawalumbu" },
          { name: "Jatiasih" },
          { name: "Pondok Gede" },
        ],
      },
      {
        name: "Depok",
        districts: [
          { name: "Beji" },
          { name: "Pancoran Mas" },
          { name: "Cipayung" },
          { name: "Sukmajaya" },
          { name: "Cilodong" },
          { name: "Cimanggis" },
          { name: "Tapos" },
          { name: "Sawangan" },
        ],
      },
      {
        name: "Bogor",
        districts: [
          { name: "Bogor Tengah" },
          { name: "Bogor Selatan" },
          { name: "Bogor Timur" },
          { name: "Bogor Barat" },
          { name: "Bogor Utara" },
          { name: "Tanah Sareal" },
        ],
      },
    ],
  },
  {
    name: "Jawa Tengah",
    cities: [
      {
        name: "Semarang",
        districts: [
          { name: "Semarang Tengah" },
          { name: "Semarang Selatan" },
          { name: "Semarang Barat" },
          { name: "Semarang Timur" },
          { name: "Semarang Utara" },
          { name: "Gayamsari" },
          { name: "Candisari" },
          { name: "Gajahmungkur" },
          { name: "Tembalang" },
          { name: "Banyumanik" },
        ],
      },
      {
        name: "Solo",
        districts: [
          { name: "Laweyan" },
          { name: "Serengan" },
          { name: "Pasar Kliwon" },
          { name: "Jebres" },
          { name: "Banjarsari" },
        ],
      },
    ],
  },
  {
    name: "Jawa Timur",
    cities: [
      {
        name: "Surabaya",
        districts: [
          { name: "Gubeng" },
          { name: "Tegalsari" },
          { name: "Genteng" },
          { name: "Bubutan" },
          { name: "Simokerto" },
          { name: "Sawahan" },
          { name: "Wonokromo" },
          { name: "Wonocolo" },
          { name: "Wiyung" },
          { name: "Gayungan" },
        ],
      },
      {
        name: "Malang",
        districts: [
          { name: "Klojen" },
          { name: "Blimbing" },
          { name: "Kedungkandang" },
          { name: "Sukun" },
          { name: "Lowokwaru" },
        ],
      },
    ],
  },
  {
    name: "Banten",
    cities: [
      {
        name: "Tangerang",
        districts: [
          { name: "Ciledug" },
          { name: "Larangan" },
          { name: "Karang Tengah" },
          { name: "Cipondoh" },
          { name: "Pinang" },
          { name: "Tangerang" },
          { name: "Karawaci" },
          { name: "Jatiuwung" },
          { name: "Cibodas" },
          { name: "Periuk" },
        ],
      },
      {
        name: "Tangerang Selatan",
        districts: [
          { name: "Serpong" },
          { name: "Serpong Utara" },
          { name: "Ciputat" },
          { name: "Ciputat Timur" },
          { name: "Pamulang" },
          { name: "Pondok Aren" },
          { name: "Setu" },
        ],
      },
    ],
  },
  {
    name: "DI Yogyakarta",
    cities: [
      {
        name: "Yogyakarta",
        districts: [
          { name: "Gondokusuman" },
          { name: "Danurejan" },
          { name: "Gedongtengen" },
          { name: "Gondomanan" },
          { name: "Jetis" },
          { name: "Kotagede" },
          { name: "Kraton" },
          { name: "Mantrijeron" },
          { name: "Mergangsan" },
          { name: "Ngampilan" },
        ],
      },
      {
        name: "Sleman",
        districts: [
          { name: "Depok" },
          { name: "Mlati" },
          { name: "Gamping" },
          { name: "Godean" },
          { name: "Ngaglik" },
        ],
      },
    ],
  },
  {
    name: "Bali",
    cities: [
      {
        name: "Denpasar",
        districts: [
          { name: "Denpasar Selatan" },
          { name: "Denpasar Timur" },
          { name: "Denpasar Barat" },
          { name: "Denpasar Utara" },
        ],
      },
      {
        name: "Badung",
        districts: [
          { name: "Kuta" },
          { name: "Kuta Selatan" },
          { name: "Kuta Utara" },
          { name: "Mengwi" },
          { name: "Abiansemal" },
          { name: "Petang" },
        ],
      },
    ],
  },
  {
    name: "Sumatera Utara",
    cities: [
      {
        name: "Medan",
        districts: [
          { name: "Medan Baru" },
          { name: "Medan Kota" },
          { name: "Medan Maimun" },
          { name: "Medan Polonia" },
          { name: "Medan Petisah" },
          { name: "Medan Sunggal" },
          { name: "Medan Helvetia" },
          { name: "Medan Selayang" },
          { name: "Medan Johor" },
          { name: "Medan Amplas" },
        ],
      },
    ],
  },
  {
    name: "Sulawesi Selatan",
    cities: [
      {
        name: "Makassar",
        districts: [
          { name: "Makassar" },
          { name: "Ujung Pandang" },
          { name: "Wajo" },
          { name: "Bontoala" },
          { name: "Tallo" },
          { name: "Ujung Tanah" },
          { name: "Panakkukang" },
          { name: "Rappocini" },
          { name: "Manggala" },
          { name: "Tamalanrea" },
        ],
      },
    ],
  },
  {
    name: "Kalimantan Timur",
    cities: [
      {
        name: "Balikpapan",
        districts: [
          { name: "Balikpapan Barat" },
          { name: "Balikpapan Timur" },
          { name: "Balikpapan Selatan" },
          { name: "Balikpapan Utara" },
          { name: "Balikpapan Tengah" },
          { name: "Balikpapan Kota" },
        ],
      },
      {
        name: "Samarinda",
        districts: [
          { name: "Samarinda Kota" },
          { name: "Samarinda Utara" },
          { name: "Samarinda Ulu" },
          { name: "Samarinda Ilir" },
          { name: "Samarinda Seberang" },
          { name: "Sungai Kunjang" },
        ],
      },
    ],
  },
  {
    name: "Sumatera Barat",
    cities: [
      {
        name: "Padang",
        districts: [
          { name: "Padang Barat" },
          { name: "Padang Timur" },
          { name: "Padang Selatan" },
          { name: "Padang Utara" },
          { name: "Nanggalo" },
          { name: "Kuranji" },
          { name: "Pauh" },
          { name: "Lubuk Begalung" },
          { name: "Lubuk Kilangan" },
          { name: "Koto Tangah" },
        ],
      },
      {
        name: "Bukittinggi",
        districts: [
          { name: "Guguk Panjang" },
          { name: "Mandiangin Koto Selayan" },
          { name: "Aur Birugo Tigo Baleh" },
        ],
      },
    ],
  },
  {
    name: "Sumatera Selatan",
    cities: [
      {
        name: "Palembang",
        districts: [
          { name: "Ilir Barat I" },
          { name: "Ilir Barat II" },
          { name: "Ilir Timur I" },
          { name: "Ilir Timur II" },
          { name: "Ilir Timur III" },
          { name: "Seberang Ulu I" },
          { name: "Seberang Ulu II" },
          { name: "Sukarami" },
          { name: "Alang-Alang Lebar" },
          { name: "Gandus" },
        ],
      },
    ],
  },
  {
    name: "Riau",
    cities: [
      {
        name: "Pekanbaru",
        districts: [
          { name: "Sukajadi" },
          { name: "Pekanbaru Kota" },
          { name: "Sail" },
          { name: "Lima Puluh" },
          { name: "Senapelan" },
          { name: "Rumbai" },
          { name: "Bukit Raya" },
          { name: "Marpoyan Damai" },
          { name: "Tenayan Raya" },
          { name: "Payung Sekaki" },
        ],
      },
    ],
  },
  {
    name: "Lampung",
    cities: [
      {
        name: "Bandar Lampung",
        districts: [
          { name: "Tanjung Karang Pusat" },
          { name: "Tanjung Karang Timur" },
          { name: "Tanjung Karang Barat" },
          { name: "Teluk Betung Selatan" },
          { name: "Teluk Betung Utara" },
          { name: "Sukarame" },
          { name: "Sukabumi" },
          { name: "Kedaton" },
          { name: "Rajabasa" },
          { name: "Tanjung Senang" },
        ],
      },
    ],
  },
  {
    name: "Kalimantan Selatan",
    cities: [
      {
        name: "Banjarmasin",
        districts: [
          { name: "Banjarmasin Barat" },
          { name: "Banjarmasin Timur" },
          { name: "Banjarmasin Selatan" },
          { name: "Banjarmasin Utara" },
          { name: "Banjarmasin Tengah" },
        ],
      },
      {
        name: "Banjarbaru",
        districts: [
          { name: "Landasan Ulin" },
          { name: "Cempaka" },
          { name: "Banjarbaru Utara" },
          { name: "Banjarbaru Selatan" },
          { name: "Liang Anggang" },
        ],
      },
    ],
  },
  {
    name: "Sulawesi Utara",
    cities: [
      {
        name: "Manado",
        districts: [
          { name: "Wenang" },
          { name: "Sario" },
          { name: "Wanea" },
          { name: "Tikala" },
          { name: "Mapanget" },
          { name: "Singkil" },
          { name: "Tuminting" },
          { name: "Bunaken" },
          { name: "Malalayang" },
        ],
      },
    ],
  },
  {
    name: "Nusa Tenggara Barat",
    cities: [
      {
        name: "Mataram",
        districts: [
          { name: "Ampenan" },
          { name: "Sekarbela" },
          { name: "Mataram" },
          { name: "Selaparang" },
          { name: "Cakranegara" },
          { name: "Sandubaya" },
        ],
      },
      {
        name: "Lombok Barat",
        districts: [
          { name: "Gerung" },
          { name: "Labuapi" },
          { name: "Kediri" },
          { name: "Kuripan" },
          { name: "Narmada" },
          { name: "Lingsar" },
          { name: "Gunungsari" },
          { name: "Batulayar" },
          { name: "Sekotong" },
          { name: "Lembar" },
        ],
      },
    ],
  },
  {
    name: "Kepulauan Riau",
    cities: [
      {
        name: "Batam",
        districts: [
          { name: "Batam Kota" },
          { name: "Bengkong" },
          { name: "Batu Aji" },
          { name: "Batu Ampar" },
          { name: "Lubuk Baja" },
          { name: "Nongsa" },
          { name: "Sagulung" },
          { name: "Sekupang" },
          { name: "Sei Beduk" },
          { name: "Galang" },
          { name: "Bulang" },
          { name: "Belakang Padang" },
        ],
      },
    ],
  },
  {
    name: "Aceh",
    cities: [
      {
        name: "Banda Aceh",
        districts: [
          { name: "Baiturrahman" },
          { name: "Kuta Alam" },
          { name: "Meuraxa" },
          { name: "Syiah Kuala" },
          { name: "Lueng Bata" },
          { name: "Kuta Raja" },
          { name: "Banda Raya" },
          { name: "Jaya Baru" },
          { name: "Ulee Kareng" },
        ],
      },
    ],
  },
];

export const getProvince = (provinceName: string): Province | undefined => {
  return INDONESIA_LOCATIONS.find(p => p.name === provinceName);
};

export const getCity = (provinceName: string, cityName: string): City | undefined => {
  const province = getProvince(provinceName);
  return province?.cities.find(c => c.name === cityName);
};

export const formatLocationDisplay = (city?: string | null, district?: string | null): string => {
  if (city && district) {
    return `${city} — ${district}`;
  }
  if (city) {
    return city;
  }
  return '';
};
