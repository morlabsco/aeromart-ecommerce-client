/**
 * Return & Refund Policy — shared SECTION model (31/10/2026).
 *
 * The dashboard manages a LIST of these sections (Settings → Return &
 * Refund) and the storefront renders them in the numbered-card design.
 * When the saved list is EMPTY the page renders `defaultReturnRefundSections`
 * — the full 8-section content from docs/data/return-&-refund-policy.md —
 * so the shipped design/content is never lost, only overridden.
 */

export interface PolicyItemData {
    lead?: string;
    text: string;
}

export interface PolicySectionData {
    title: string;
    intro?: string;
    paragraphs?: string[];
    items?: PolicyItemData[];
    checklist?: string[];
    callout?: string;
    note?: string;
}

/** Latin digits → Bengali digits, zero-padded ("০১", "০২"…). */
export function bengaliNumeral(n: number): string {
    return n
        .toString()
        .padStart(2, "0")
        .replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}

/** The shipped default sections (brand name interpolated at render time). */
export function defaultReturnRefundSections(brand: string): PolicySectionData[] {
    return [
        {
            title: "ডেলিভারির সময় পণ্য যাচাই বাধ্যতামূলক",
            paragraphs: [
                `পণ্যে Manufacturing Defect থাকলে, ডেলিভারির সময় ড্যামেজ অবস্থায় পাওয়া গেলে অথবা ভুল পণ্য পাঠানো হলে Delivery Man-এর সামনে পণ্যটি চেক করে Confirm করার পরই Return/Replacement Request করতে পারবেন।`,
                `Delivery Man-এর কাছ থেকে পণ্য গ্রহণ করার পর Broken, Defected বা Wrong Product সংক্রান্ত Return/Replacement Request গ্রহণ করা হবে না।`,
                `উপরোক্ত কারণগুলোর বাইরে অন্য কোনো কারণে পণ্য Return করতে চাইলে, প্রযোজ্য ক্ষেত্রে নির্ধারিত Delivery Charge প্রদান করে Return Request করতে পারবেন।`,
            ],
        },
        {
            title: "3 দিনের রিপ্লেসমেন্ট গ্যারান্টি",
            paragraphs: [
                `পণ্য হাতে পাওয়ার দিন থেকে ${brand}-এর 3 দিনের Replacement Guarantee কার্যকর থাকবে।`,
                `Delivery Man-এর সামনে পণ্য যাচাই করে সঠিক ও কার্যকর অবস্থায় বুঝে নেওয়ার পর, স্বাভাবিক ব্যবহারের মধ্যে যদি পণ্যটি হঠাৎ কাজ করা বন্ধ করে দেয় অথবা কোনো Manufacturing/Technical Defect দেখা দেয়, তাহলে Delivery Date থেকে 3 দিনের মধ্যে ${brand} Support Team-এর কাছে Claim করতে হবে।`,
                `3 দিনের পর করা Replacement Request সাধারণত গ্রহণযোগ্য হবে না, যদি না পণ্যটির জন্য আলাদা Warranty প্রযোজ্য থাকে।`,
            ],
            callout: `বিশেষ দ্রষ্টব্য: ${brand}-এর কিছু পণ্যে আলাদা Warranty থাকতে পারে। Warranty-এর সময়কাল ও শর্ত Product Page, Invoice, Warranty Card অথবা সংশ্লিষ্ট Sales Information-এ উল্লেখ থাকবে।`,
        },
        {
            title: "যেসব ক্ষেত্রে রিপ্লেসমেন্ট প্রযোজ্য",
            intro: "নিচের পরিস্থিতিতে Replacement Request গ্রহণ করা হতে পারে:",
            items: [
                { lead: "Manufacturing Defect:", text: "পণ্যটি Manufacturing বা Technical সমস্যার কারণে সঠিকভাবে কাজ না করলে।" },
                { lead: "ডেলিভারির সময় ড্যামেজ:", text: "পণ্যটি ভাঙা বা Physical Damage অবস্থায় পাওয়া গেলে।" },
                { lead: "ভুল পণ্য:", text: "অর্ডার করা পণ্যের পরিবর্তে অন্য Product, Model, Size, Color বা Variant পাঠানো হলে।" },
                { lead: "পণ্য বা Accessories মিসিং:", text: "প্যাকেজে থাকার কথা এমন Product বা Accessories না থাকলে। এক্ষেত্রে Unboxing Video প্রয়োজন হবে।" },
            ],
            note: "(উপরের ক্ষেত্রে অবশ্যই Delivery Man-এর সামনে পণ্য চেক করে বিষয়টি Confirm করতে হবে।)",
        },
        {
            title: "যেসব ক্ষেত্রে রিটার্ন, রিপ্লেসমেন্ট বা রিফান্ড প্রযোজ্য নয়",
            intro: "নিচের পরিস্থিতিতে Return, Replacement বা Refund গ্রহণযোগ্য নাও হতে পারে:",
            items: [
                { lead: "ব্যবহারকারীর কারণে ক্ষতি:", text: "হাত থেকে পড়ে যাওয়া, আঘাত লাগা, ভুল ব্যবহার, অসতর্কতা অথবা Accident-এর কারণে পণ্য নষ্ট হলে।" },
                { lead: "পানি বা Liquid Damage:", text: "পানি, আর্দ্রতা বা অন্য কোনো তরলের কারণে পণ্য ক্ষতিগ্রস্ত হলে, যদি না সংশ্লিষ্ট পণ্যে এ ধরনের Damage Coverage স্পষ্টভাবে উল্লেখ থাকে।" },
                { lead: "Electrical Damage:", text: "Voltage Fluctuation, Short Circuit, Power Surge, ভুল Power Source অথবা ভুল/অসামঞ্জস্যপূর্ণ Charger, Adapter, Cable বা Power Supply ব্যবহারের কারণে পণ্য নষ্ট হলে।" },
                { lead: "Unauthorized Repair:", text: `${brand}-এর অনুমোদন ছাড়া পণ্য খুলে ফেলা, Repair, Modification বা Tampering করা হলে।` },
                { lead: "পছন্দ পরিবর্তন:", text: "সঠিক ও কার্যকর পণ্য পাওয়ার পর শুধুমাত্র ভালো না লাগা, প্রয়োজন না থাকা বা মত পরিবর্তনের কারণে Return/Refund গ্রহণযোগ্য নয়।" },
                { lead: "ব্যবহারের পর Physical Damage:", text: "পণ্য ব্যবহারের পর Scratch, Crack, Broken Parts অথবা অন্য কোনো Physical Damage হলে।" },
                { lead: "Box বা Accessories হারানো:", text: "Original Box, Accessories, Manual, Warranty Card, Label বা পণ্যের সঙ্গে দেওয়া কোনো অংশ হারিয়ে গেলে বা নষ্ট করলে।" },
                { lead: "ভুলভাবে ব্যবহার:", text: "পণ্যের নির্ধারিত ব্যবহারবিধির বাইরে ব্যবহার করার কারণে সমস্যা হলে।" },
            ],
        },
        {
            title: "বাধ্যতামূলক Unboxing Video",
            intro: "নিচের ধরনের অভিযোগের ক্ষেত্রে Unboxing Video বাধ্যতামূলক:",
            items: [
                { text: "ভাঙা পণ্য" },
                { text: "Physical Damage" },
                { text: "ভুল পণ্য" },
                { text: "পণ্য বা Accessories মিসিং" },
            ],
            paragraphs: [
                "ডেলিভারি প্যাকেটটি প্রথমবার খোলার সময় শুরু থেকে শেষ পর্যন্ত একটি পরিষ্কার ও Continuous Video ধারণ করুন।",
                "ভিডিওতে স্পষ্টভাবে দেখা যেতে হবে:",
            ],
            checklist: [
                "প্যাকেট খোলার আগের অবস্থা",
                "Shipping Label / Order Information",
                "সম্পূর্ণ Unboxing Process",
                "Product ও Accessories",
                "কোনো Damage, Wrong Product বা Missing Item থাকলে সেটি",
            ],
            note: "যথাযথ Unboxing Video ছাড়া Physical Damage, Missing Item বা Wrong Product সংক্রান্ত অভিযোগ গ্রহণযোগ্য নাও হতে পারে।",
        },
        {
            title: "কিভাবে Replacement Request করবেন?",
            intro: "আপনার সমস্যাটি আমাদের Policy-এর আওতাভুক্ত হলে:",
            items: [
                { lead: `${brand} Support-এ যোগাযোগ করুন:`, text: "পণ্য পাওয়ার 3 দিনের মধ্যে আমাদের জানান।" },
                { lead: "Order Information দিন:", text: "Order ID, অর্ডারে ব্যবহৃত Phone Number এবং সমস্যার বিস্তারিত জানান।" },
                { lead: "প্রমাণ পাঠান:", text: "সমস্যার পরিষ্কার ছবি/ভিডিও এবং প্রয়োজন হলে Unboxing Video পাঠান।" },
                { lead: "Verification:", text: "আমাদের Support Team আপনার অভিযোগ ও প্রমাণ যাচাই করবে।" },
                { lead: "পণ্য ফেরত পাঠানো:", text: "Request Approved হলে পণ্য ফেরত পাঠানোর নিয়ম ও প্রয়োজনীয় তথ্য জানানো হবে।" },
                { lead: "Inspection:", text: "পণ্যটি আমাদের কাছে পৌঁছানোর পর প্রয়োজন অনুযায়ী যাচাই করে Replacement বা Warranty Service প্রদান করা হবে।" },
            ],
        },
        {
            title: "রিফান্ড পলিসি",
            paragraphs: [
                `যোগ্য Product Issue-এর ক্ষেত্রে ${brand} সাধারণত Replacement অথবা Warranty Service প্রদানকে অগ্রাধিকার দেয়।`,
                "সঠিক এবং কার্যকর পণ্য পাওয়ার পর শুধুমাত্র মত পরিবর্তনের কারণে Refund প্রযোজ্য হবে না।",
                "বিশেষ কোনো পরিস্থিতিতে Refund অনুমোদিত হলে Refund-এর মাধ্যম এবং Processing Time আমাদের Support Team থেকে জানিয়ে দেওয়া হবে।",
            ],
        },
        {
            title: "Warranty Service",
            paragraphs: [
                "যেসব পণ্যে আলাদা Warranty রয়েছে, সেই পণ্যের নির্ধারিত Warranty Period এবং Conditions অনুযায়ী Warranty Service প্রদান করা হবে।",
                "সাধারণত Warranty শুধুমাত্র যোগ্য Manufacturing বা Technical Defect-এর ক্ষেত্রে প্রযোজ্য। Physical Damage, Accidental Damage, Water Damage, Electrical Damage অথবা ভুল ব্যবহারের কারণে হওয়া ক্ষতি Warranty-এর আওতাভুক্ত হবে না—যদি সংশ্লিষ্ট পণ্যের Warranty Terms-এ আলাদাভাবে উল্লেখ না থাকে।",
            ],
        },
    ];
}
