/**
 * The COMPLETE Return & Refund Policy content as rich HTML — a single source
 * shared by two places:
 *
 *   1. the public /return-refund-policy page (rendered whenever the admin
 *      override in Settings → Return & Refund is empty), and
 *   2. the dashboard editor's "Load default policy" button, so the owner
 *      starts from the full current content instead of a blank page.
 *
 * Content replicates docs/data/return-&-refund-policy.md section by section
 * (8 numbered sections) and renders through the storefront's token-styled
 * `.rich-description` container. The brand name is interpolated at runtime.
 */

export function buildDefaultReturnRefundHtml(brand: string): string {
    return `<h2>০১ · ডেলিভারির সময় পণ্য যাচাই বাধ্যতামূলক</h2>
<p>পণ্যে Manufacturing Defect থাকলে, ডেলিভারির সময় ড্যামেজ অবস্থায় পাওয়া গেলে অথবা ভুল পণ্য পাঠানো হলে Delivery Man-এর সামনে পণ্যটি চেক করে Confirm করার পরই Return/Replacement Request করতে পারবেন।</p>
<p>Delivery Man-এর কাছ থেকে পণ্য গ্রহণ করার পর Broken, Defected বা Wrong Product সংক্রান্ত Return/Replacement Request গ্রহণ করা হবে না।</p>
<p>উপরোক্ত কারণগুলোর বাইরে অন্য কোনো কারণে পণ্য Return করতে চাইলে, প্রযোজ্য ক্ষেত্রে নির্ধারিত Delivery Charge প্রদান করে Return Request করতে পারবেন।</p>

<h2>০২ · 3 দিনের রিপ্লেসমেন্ট গ্যারান্টি</h2>
<p>পণ্য হাতে পাওয়ার দিন থেকে ${brand}-এর 3 দিনের Replacement Guarantee কার্যকর থাকবে।</p>
<p>Delivery Man-এর সামনে পণ্য যাচাই করে সঠিক ও কার্যকর অবস্থায় বুঝে নেওয়ার পর, স্বাভাবিক ব্যবহারের মধ্যে যদি পণ্যটি হঠাৎ কাজ করা বন্ধ করে দেয় অথবা কোনো Manufacturing/Technical Defect দেখা দেয়, তাহলে Delivery Date থেকে 3 দিনের মধ্যে ${brand} Support Team-এর কাছে Claim করতে হবে।</p>
<p>3 দিনের পর করা Replacement Request সাধারণত গ্রহণযোগ্য হবে না, যদি না পণ্যটির জন্য আলাদা Warranty প্রযোজ্য থাকে।</p>
<blockquote>বিশেষ দ্রষ্টব্য: ${brand}-এর কিছু পণ্যে আলাদা Warranty থাকতে পারে। Warranty-এর সময়কাল ও শর্ত Product Page, Invoice, Warranty Card অথবা সংশ্লিষ্ট Sales Information-এ উল্লেখ থাকবে।</blockquote>

<h2>০৩ · যেসব ক্ষেত্রে রিপ্লেসমেন্ট প্রযোজ্য</h2>
<p>নিচের পরিস্থিতিতে Replacement Request গ্রহণ করা হতে পারে:</p>
<ul>
<li><strong>Manufacturing Defect:</strong> পণ্যটি Manufacturing বা Technical সমস্যার কারণে সঠিকভাবে কাজ না করলে।</li>
<li><strong>ডেলিভারির সময় ড্যামেজ:</strong> পণ্যটি ভাঙা বা Physical Damage অবস্থায় পাওয়া গেলে।</li>
<li><strong>ভুল পণ্য:</strong> অর্ডার করা পণ্যের পরিবর্তে অন্য Product, Model, Size, Color বা Variant পাঠানো হলে।</li>
<li><strong>পণ্য বা Accessories মিসিং:</strong> প্যাকেজে থাকার কথা এমন Product বা Accessories না থাকলে। এক্ষেত্রে Unboxing Video প্রয়োজন হবে।</li>
</ul>
<p><em>(উপরের ক্ষেত্রে অবশ্যই Delivery Man-এর সামনে পণ্য চেক করে বিষয়টি Confirm করতে হবে।)</em></p>

<h2>০৪ · যেসব ক্ষেত্রে রিটার্ন, রিপ্লেসমেন্ট বা রিফান্ড প্রযোজ্য নয়</h2>
<p>নিচের পরিস্থিতিতে Return, Replacement বা Refund গ্রহণযোগ্য নাও হতে পারে:</p>
<ul>
<li><strong>ব্যবহারকারীর কারণে ক্ষতি:</strong> হাত থেকে পড়ে যাওয়া, আঘাত লাগা, ভুল ব্যবহার, অসতর্কতা অথবা Accident-এর কারণে পণ্য নষ্ট হলে।</li>
<li><strong>পানি বা Liquid Damage:</strong> পানি, আর্দ্রতা বা অন্য কোনো তরলের কারণে পণ্য ক্ষতিগ্রস্ত হলে, যদি না সংশ্লিষ্ট পণ্যে এ ধরনের Damage Coverage স্পষ্টভাবে উল্লেখ থাকে।</li>
<li><strong>Electrical Damage:</strong> Voltage Fluctuation, Short Circuit, Power Surge, ভুল Power Source অথবা ভুল/অসামঞ্জস্যপূর্ণ Charger, Adapter, Cable বা Power Supply ব্যবহারের কারণে পণ্য নষ্ট হলে।</li>
<li><strong>Unauthorized Repair:</strong> ${brand}-এর অনুমোদন ছাড়া পণ্য খুলে ফেলা, Repair, Modification বা Tampering করা হলে।</li>
<li><strong>পছন্দ পরিবর্তন:</strong> সঠিক ও কার্যকর পণ্য পাওয়ার পর শুধুমাত্র ভালো না লাগা, প্রয়োজন না থাকা বা মত পরিবর্তনের কারণে Return/Refund গ্রহণযোগ্য নয়।</li>
<li><strong>ব্যবহারের পর Physical Damage:</strong> পণ্য ব্যবহারের পর Scratch, Crack, Broken Parts অথবা অন্য কোনো Physical Damage হলে।</li>
<li><strong>Box বা Accessories হারানো:</strong> Original Box, Accessories, Manual, Warranty Card, Label বা পণ্যের সঙ্গে দেওয়া কোনো অংশ হারিয়ে গেলে বা নষ্ট করলে।</li>
<li><strong>ভুলভাবে ব্যবহার:</strong> পণ্যের নির্ধারিত ব্যবহারবিধির বাইরে ব্যবহার করার কারণে সমস্যা হলে।</li>
</ul>

<h2>০৫ · বাধ্যতামূলক Unboxing Video</h2>
<p>নিচের ধরনের অভিযোগের ক্ষেত্রে Unboxing Video বাধ্যতামূলক:</p>
<ul>
<li>ভাঙা পণ্য</li>
<li>Physical Damage</li>
<li>ভুল পণ্য</li>
<li>পণ্য বা Accessories মিসিং</li>
</ul>
<p>ডেলিভারি প্যাকেটটি প্রথমবার খোলার সময় শুরু থেকে শেষ পর্যন্ত একটি পরিষ্কার ও Continuous Video ধারণ করুন।</p>
<p>ভিডিওতে স্পষ্টভাবে দেখা যেতে হবে:</p>
<ul>
<li>প্যাকেট খোলার আগের অবস্থা</li>
<li>Shipping Label / Order Information</li>
<li>সম্পূর্ণ Unboxing Process</li>
<li>Product ও Accessories</li>
<li>কোনো Damage, Wrong Product বা Missing Item থাকলে সেটি</li>
</ul>
<p><em>যথাযথ Unboxing Video ছাড়া Physical Damage, Missing Item বা Wrong Product সংক্রান্ত অভিযোগ গ্রহণযোগ্য নাও হতে পারে।</em></p>

<h2>০৬ · কিভাবে Replacement Request করবেন?</h2>
<p>আপনার সমস্যাটি আমাদের Policy-এর আওতাভুক্ত হলে:</p>
<ul>
<li><strong>${brand} Support-এ যোগাযোগ করুন:</strong> পণ্য পাওয়ার 3 দিনের মধ্যে আমাদের জানান।</li>
<li><strong>Order Information দিন:</strong> Order ID, অর্ডারে ব্যবহৃত Phone Number এবং সমস্যার বিস্তারিত জানান।</li>
<li><strong>প্রমাণ পাঠান:</strong> সমস্যার পরিষ্কার ছবি/ভিডিও এবং প্রয়োজন হলে Unboxing Video পাঠান।</li>
<li><strong>Verification:</strong> আমাদের Support Team আপনার অভিযোগ ও প্রমাণ যাচাই করবে।</li>
<li><strong>পণ্য ফেরত পাঠানো:</strong> Request Approved হলে পণ্য ফেরত পাঠানোর নিয়ম ও প্রয়োজনীয় তথ্য জানানো হবে।</li>
<li><strong>Inspection:</strong> পণ্যটি আমাদের কাছে পৌঁছানোর পর প্রয়োজন অনুযায়ী যাচাই করে Replacement বা Warranty Service প্রদান করা হবে।</li>
</ul>

<h2>০৭ · রিফান্ড পলিসি</h2>
<p>যোগ্য Product Issue-এর ক্ষেত্রে ${brand} সাধারণত Replacement অথবা Warranty Service প্রদানকে অগ্রাধিকার দেয়।</p>
<p>সঠিক এবং কার্যকর পণ্য পাওয়ার পর শুধুমাত্র মত পরিবর্তনের কারণে Refund প্রযোজ্য হবে না।</p>
<p>বিশেষ কোনো পরিস্থিতিতে Refund অনুমোদিত হলে Refund-এর মাধ্যম এবং Processing Time আমাদের Support Team থেকে জানিয়ে দেওয়া হবে।</p>

<h2>০৮ · Warranty Service</h2>
<p>যেসব পণ্যে আলাদা Warranty রয়েছে, সেই পণ্যের নির্ধারিত Warranty Period এবং Conditions অনুযায়ী Warranty Service প্রদান করা হবে।</p>
<p>সাধারণত Warranty শুধুমাত্র যোগ্য Manufacturing বা Technical Defect-এর ক্ষেত্রে প্রযোজ্য। Physical Damage, Accidental Damage, Water Damage, Electrical Damage অথবা ভুল ব্যবহারের কারণে হওয়া ক্ষতি Warranty-এর আওতাভুক্ত হবে না—যদি সংশ্লিষ্ট পণ্যের Warranty Terms-এ আলাদাভাবে উল্লেখ না থাকে।</p>`;
}
