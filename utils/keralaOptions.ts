/**
 * Kerala districts, towns and local bodies for district/town/panchayath selectors.
 * Shared by Profile, Register and any form that needs location fields.
 */

export const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
];

export const TOWNS_BY_DISTRICT: Record<string, string[]> = {
  Thiruvananthapuram: ["Neyyattinkara", "Nedumangad", "Attingal", "Varkala", "Thiruvananthapuram City"],
  Kollam: ["Kollam Town", "Punalur", "Karunagappally", "Kottarakkara", "Paravur"],
  Pathanamthitta: ["Pathanamthitta Town", "Adoor", "Thiruvalla", "Ranni", "Kozhencherry"],
  Alappuzha: ["Alappuzha Town", "Cherthala", "Kayamkulam", "Mavelikkara", "Haripad"],
  Kottayam: ["Kottayam Town", "Pala", "Changanassery", "Ettumanoor", "Vaikom"],
  Idukki: ["Thodupuzha", "Munnar", "Adimali", "Kattappana", "Nedumkandam"],
  Ernakulam: ["Kochi", "Aluva", "Angamaly", "Perumbavoor", "Muvattupuzha", "North Paravur"],
  Thrissur: ["Thrissur City", "Chalakudy", "Irinjalakuda", "Kodungallur", "Guruvayur"],
  Palakkad: ["Palakkad Town", "Ottapalam", "Shoranur", "Chittur", "Mannarkkad", "Alathur"],
  Malappuram: ["Malappuram Town", "Manjeri", "Perinthalmanna", "Tirur", "Ponnani", "Nilambur"],
  Kozhikode: ["Kozhikode City", "Vadakara", "Koyilandy", "Ramanattukara", "Feroke"],
  Wayanad: ["Kalpetta", "Sulthan Bathery", "Mananthavady"],
  Kannur: ["Kannur City", "Thalassery", "Payyanur", "Iritty", "Mattannur"],
  Kasaragod: ["Kasaragod Town", "Kanhangad", "Nileshwaram", "Bekal"],
};

export const LOCAL_BODIES_BY_DISTRICT: Record<string, string[]> = {
  Thiruvananthapuram: ["Kazhakkoottam", "Venganoor", "Vilavoorkkal", "Pothencode", "Azhoor", "Thiruvananthapuram Corp."],
  Kollam: ["Chadayamangalam", "Ittiva", "Kulathupuzha", "Pavithreswaram", "Veliyam", "Kollam Corp."],
  Pathanamthitta: ["Aranmula", "Eraviperoor", "Kadapra", "Kallooppara", "Mallappally"],
  Alappuzha: ["Ambalappuzha South", "Aryad", "Budhanoor", "Champakulam", "Kanjikuzhy", "Alappuzha Municipality"],
  Kottayam: ["Kumaranalloor", "Aymanam", "Athirampuzha", "Arpookara", "Manarcad", "Kottayam Municipality"],
  Idukki: ["Arakulam", "Edamalakkudy", "Kanchiyar", "Mariyapuram", "Udumbannoor"],
  Ernakulam: ["Amballoor", "Chendamangalam", "Kadamakkudy", "Kumbalangi", "Mulavukad", "Kochi Corp."],
  Thrissur: ["Adat", "Anthikad", "Chazhur", "Engandiyur", "Kadangode", "Thrissur Corp."],
  Palakkad: ["Agali", "Akathethara", "Elappully", "Kannambra", "Keralassery", "Palakkad Municipality"],
  Malappuram: ["Anakkayam", "Chelembra", "Edappal", "Irimbiliyam", "Kuruva", "Malappuram Municipality"],
  Kozhikode: ["Balusseri", "Changaroth", "Chelannur", "Koduvally", "Kunnamangalam", "Kozhikode Corp."],
  Wayanad: ["Ambalavayal", "Edavaka", "Meenangadi", "Nenmeni", "Poothadi"],
  Kannur: ["Azhikode", "Cheruthazham", "Chirakkal", "Eranholi", "Kadambur", "Kannur Corp."],
  Kasaragod: ["Ajanur", "Bedadka", "Chemnad", "Enmakaje", "Kallar", "Kasaragod Municipality"],
};
