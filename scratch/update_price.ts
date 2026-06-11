import { db } from '../src/lib/db';

async function updatePricing() {
  console.log('Updating Premium plan price to 7000 DZD...');
  
  const landingContent = await db.landingContent.findUnique({
    where: { section: 'pricing' }
  });

  if (landingContent && landingContent.content) {
    const content = JSON.parse(landingContent.content);
    const updatedContent = content.map((item: any) => {
      if (item.plan === 'PREMIUM') {
        return { ...item, price: 7000 };
      }
      return item;
    });

    await db.landingContent.update({
      where: { section: 'pricing' },
      data: { content: JSON.stringify(updatedContent) }
    });

    console.log('✅ Updated successfully!');
  } else {
    console.log('❌ Pricing section not found in database.');
  }
}

updatePricing()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
