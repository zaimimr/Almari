import os
from labels import KINDS, recognize
SAMPLES = {"mauve-hijab":("hijab","western"),"ivory-hijab":("hijab","western"),"chocolate-hijab":("hijab","western"),"ivory-tunic":("tunic","western"),"sage-kurta":("kurta","desi"),"navy-blazer":("blazer","western"),"taupe-abaya":("abaya","western"),"ivory-trousers":("wide-leg","western"),"charcoal-trousers":("wide-leg","western"),"ivory-salwar":("shalwar","desi"),"chocolate-loafers":("loafers","western"),"taupe-bag":("handbag","western"),"olive-maxi-dress":("dress","western")}
WEB = {"abaya-0":("abaya","western"),"abaya-2":("abaya","western"),"shalwar-0":("shalwar","desi"),"shalwar-3":("shalwar","desi"),"blazer-1":("blazer","western"),"cardigan-1":("cardigan","western"),"loafers-1":("loafers","western"),"loafers-2":("loafers","western"),"bag-0":("handbag","western"),"bag-1":("handbag","western"),"bag-2":("crossbody","western"),"bag-3":("handbag","western"),"dress-0":("dress","western"),"dress-2":("dress","western"),"trousers-0":("trousers","western"),"trousers-3":("trousers","western"),"skirt-3":("skirt","western"),"coat-0":("coat","western"),"coat-2":("coat","western"),"coat-3":("coat","western"),"boots-1":("sneakers","western"),"boots-2":("heels","western"),"boots-3":("boots","western"),"top-1":("blouse","western"),"top-3":("blouse","western"),"sneakers-1":("sneakers","western"),"sneakers-2":("sneakers","western"),"sneakers-3":("sneakers","western")}
OV = {"scarf-3":("shawl","western"),"scarf-5":("hijab","western"),"tunic-1":("top","western"),"tunic-2":("top","western"),"cardigan-1":("cardigan","western"),"cardigan-2":("cardigan","western"),"kurta-2":("kurta","desi")}
EXTRA = {"instant-hijab-0":("instant-hijab","western"),"underscarf-0":("underscarf","western"),"kurti-0":("kurti","desi"),"churidar-0":("churidar","desi"),"sharara-0":("sharara","desi"),"gharara-0":("gharara","desi"),"lehenga-0":("lehenga","desi"),"anarkali-0":("anarkali","desi"),"kaftan-0":("kaftan","western"),"waistcoat-0":("waistcoat","desi"),"khussa-0":("khussa","desi"),"sandals-0":("sandals","desi"),"blouse-0":("blouse","desi"),"jeans-0":("jeans","western"),"sweater-0":("sweater","western"),"t-shirt-0":("t-shirt","western"),"wide-leg-0":("wide-leg","western"),"flats-0":("flats","western"),"tote-0":("tote","western"),"jewellery-0":("jewellery","desi")}
def cases(root, existing=True):
    out=[]
    for k,(kind,style) in SAMPLES.items(): out.append((f"{root}/assets/wardrobe/{k}.png", kind, style, "sample"))
    for k,(kind,style) in WEB.items(): out.append((f"web/{k}.jpg", kind, style, "web"))
    for k,(kind,style) in OV.items(): out.append((f"ov/{k}.jpg", kind, style, "web"))
    for k,(kind,style) in EXTRA.items(): out.append((f"extra/{k}.jpg", kind, style, "extra"))
    return [c for c in out if os.path.exists(c[0])] if existing else out
def load(root):
    found, total = cases(root), cases(root, existing=False)
    print(f"photos found: {len(found)} of {len(total)}")
    if not found:
        print("no evaluation photos found; add them to web/, ov/ and extra/ as listed in README.md")
        raise SystemExit(0)
    return found
def summary(results):
    sets = (("original", lambda g: g != "extra"), ("extra", lambda g: g == "extra"), ("all", lambda g: True))
    for name, keep in sets:
        rows = [r for r in results if keep(r[3])]; n = len(rows); cat = kind = style = asked = 0
        for path, truth, true_style, group, scores in rows:
            category, predicted, styles, question = recognize(scores["kind"], scores["style"])
            cat += category == KINDS[truth][0]; kind += predicted == truth; style += true_style in styles; asked += question is not None
        print(f"  {name}: n={n} category={cat}/{n} subcategory={kind}/{n} style={style}/{n} questions={asked}/{n}")
    for m in (0.005, 0.01, 0.015, 0.02):
        asked = silent = 0
        for path, truth, true_style, group, scores in results:
            category, predicted, styles, question = recognize(scores["kind"], scores["style"], m)
            asked += question is not None
            silent += question is None and (predicted != truth or true_style not in styles)
        print(f"  margin {m}: questions={asked}/{len(results)} wrong without a question={silent}")
    for path, truth, true_style, group, scores in results:
        category, predicted, styles, question = recognize(scores["kind"], scores["style"])
        if predicted != truth or true_style not in styles:
            print("   wrong", path.split("/")[-1], truth, true_style, "->", predicted, styles, question)
