/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'chattrade.com',
      'img.freepik.com',
      'crabsdelivery.com.sg',
      'images.getrecipekit.com',
      'salu-salo.com',
      'jocooks.com',
      'www.jocooks.com',
      'thepeachkitchen.com',   // Add this line
      'www.thepeachkitchen.com',// Add this line
      'graceland.ph',
      'www.kawalingpinoy.com',
      'localhost',
      't4.ftcdn.net',
      'recipes.net',
      'mir-s3-cdn-cf.behance.net',
      'pagadorlawrence.wordpress.com',
      'queencitycebu.com',
      'proudlyfilipino.com',  // Add Facebook CDN domain
      'partybashcatering.com', 
    ],
  },
};

export default nextConfig;
