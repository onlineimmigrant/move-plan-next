# CLS Fix Implementation Guide - Quick Start

## 🎯 Quick Priority List

### Phase 1: Critical (Do First - 1 hour)
1. ✅ Fix hero background images (fill prop)
2. ✅ Fix metric images (aspect ratio)
3. ✅ Fix inline hero images (container with aspect-ratio)

### Phase 2: Important (Do Second - 30 min)
4. ✅ Add next/font optimization
5. ✅ Match skeleton heights to content

### Phase 3: Polish (Do Last - 30 min)
6. ✅ Add blur placeholders
7. ✅ Preload critical images

---

## 📝 Implementation Commands

```bash
# Check current CLS score
npm run build
npm start
# Open Chrome DevTools > Lighthouse > Run audit

# After fixes, compare scores
```

---

## 🔧 Files to Modify

1. **src/components/TemplateSection.tsx** (2 image fixes)
2. **src/components/HomePageSections/Hero.tsx** (2 image fixes)
3. **src/app/layout.tsx** (add next/font)
4. **src/components/skeletons/TemplateSectionSkeletons.tsx** (add min-heights)

---

## 📊 Expected Results

Before:
- CLS: ~0.25-0.35 (Poor) ❌
- Images jump during load
- Text reflows

After:
- CLS: ~0.05-0.08 (Good) ✅
- No visible shifts
- Smooth loading

---

## ✅ Testing Checklist

- [ ] Run Lighthouse audit
- [ ] Test on slow 3G
- [ ] Test on different viewports (mobile, tablet, desktop)
- [ ] Check hero section (above-the-fold)
- [ ] Check metric images
- [ ] Check font loading
- [ ] Verify no layout shifts in DevTools Performance

---

Ready to implement!
