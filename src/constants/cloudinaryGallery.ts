/**
 * General Assembly / event photos on Cloudinary (f_auto,q_auto,w_1920).
 * Single source of truth for dashboard + public Community page.
 */

/** Landing page coop intro video (hosted on Cloudinary — not in git). */
export const LANDING_VIDEO_URL =
  'https://res.cloudinary.com/fncjex7d/video/upload/v1787850314/uc_coop/videos/FINAL_COOP.mp4';

export const GALLERY_IMAGE_URLS: readonly string[] = [
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849623/uc_coop/gallery/gallery_2.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849626/uc_coop/gallery/gallery_4.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849631/uc_coop/gallery/gallery_5.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849636/uc_coop/gallery/gallery_6.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849640/uc_coop/gallery/gallery_10.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849644/uc_coop/gallery/gallery_11.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849648/uc_coop/gallery/gallery_13.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849652/uc_coop/gallery/gallery_15.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849656/uc_coop/gallery/gallery_18.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849661/uc_coop/gallery/gallery_19.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849665/uc_coop/gallery/gallery_22.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849670/uc_coop/gallery/gallery_24.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849673/uc_coop/gallery/gallery_25.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849678/uc_coop/gallery/gallery_30.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849684/uc_coop/gallery/gallery_34.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849690/uc_coop/gallery/gallery_36.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849696/uc_coop/gallery/gallery_39.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849703/uc_coop/gallery/gallery_42.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849709/uc_coop/gallery/gallery_44.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849712/uc_coop/gallery/gallery_47.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849717/uc_coop/gallery/gallery_51.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849721/uc_coop/gallery/gallery_59.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849725/uc_coop/gallery/gallery_62.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849729/uc_coop/gallery/gallery_65.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849734/uc_coop/gallery/gallery_68.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849738/uc_coop/gallery/gallery_73.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849741/uc_coop/gallery/gallery_76.jpg',
  'https://res.cloudinary.com/fncjex7d/image/upload/v1787849745/uc_coop/gallery/gallery_78.jpg',
];

/** Indices in GALLERY_IMAGE_URLS: 2=5.png, 1=4.png, 11=24.png, 16=39.png */
const COMMUNITY_GA_INDICES = [2, 1, 11, 16] as const;

/** Public Community page — 11th GA carousel (matches original local asset order) */
export const COMMUNITY_GA_GALLERY_URLS: readonly string[] = COMMUNITY_GA_INDICES.map(
  (i) => GALLERY_IMAGE_URLS[i]
);
