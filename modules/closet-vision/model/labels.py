DESI = ["desi"]
BOTH = ["western", "desi"]

KINDS = {
 "hijab": ("hijab", BOTH, ["a folded hijab headscarf", "a chiffon hijab scarf", "a jersey hijab"]),
 "instant-hijab": ("hijab", BOTH, ["an instant slip-on hijab with a sewn face opening", "a pull-on one-piece hijab"]),
 "underscarf": ("hijab", BOTH, ["a tube underscarf hijab cap", "a fitted bonnet underscarf"]),
 "shawl": ("hijab", BOTH, ["a wide woven shawl", "a knitted winter scarf", "a pashmina wrap"]),
 "blouse": ("top", None, ["a blouse", "a silk blouse"]),
 "shirt": ("top", None, ["a button-up collared shirt"]),
 "t-shirt": ("top", None, ["a t-shirt"]),
 "sweater": ("top", None, ["a knitted sweater", "a pullover jumper"]),
 "top": ("top", None, ["a top", "a sleeveless top"]),
 "kurta": ("tunic", DESI, ["an embroidered kurta, a long South Asian tunic"]),
 "kurti": ("tunic", DESI, ["a short kurti, a hip-length South Asian tunic"]),
 "kameez": ("tunic", DESI, ["a kameez, the long tunic of a shalwar kameez suit"]),
 "tunic": ("tunic", None, ["a long tunic top"]),
 "trousers": ("bottom", None, ["a pair of trousers", "a pair of tailored pants"]),
 "jeans": ("bottom", None, ["a pair of blue denim jeans"]),
 "wide-leg": ("bottom", None, ["a pair of wide-leg palazzo trousers"]),
 "shalwar": ("bottom", DESI, ["salwar trousers, loose gathered South Asian trousers"]),
 "churidar": ("bottom", DESI, ["churidar trousers, tight South Asian trousers gathered at the ankle"]),
 "sharara": ("bottom", DESI, ["sharara trousers, flared from the knee"]),
 "gharara": ("bottom", DESI, ["gharara trousers, gathered and flared at the knee with a band"]),
 "lehenga": ("bottom", DESI, ["a lehenga, a long embroidered South Asian skirt"]),
 "skirt": ("bottom", None, ["a long skirt", "a midi skirt"]),
 "dress": ("dress", None, ["a long dress", "a maxi dress", "a gown"]),
 "anarkali": ("dress", DESI, ["an anarkali, a long flared South Asian frock"]),
 "abaya": ("dress", None, ["an abaya, a long loose robe"]),
 "kaftan": ("dress", None, ["a kaftan, a loose wide-sleeved robe"]),
 "blazer": ("layer", None, ["a blazer jacket", "a suit jacket"]),
 "cardigan": ("layer", BOTH, ["a knit cardigan sweater"]),
 "jacket": ("layer", None, ["a jacket", "a denim jacket"]),
 "coat": ("layer", BOTH, ["a coat", "a cape"]),
 "waistcoat": ("layer", None, ["a sleeveless waistcoat vest"]),
 "sneakers": ("shoes", BOTH, ["a pair of sneakers"]),
 "flats": ("shoes", BOTH, ["a pair of ballet flats"]),
 "loafers": ("shoes", None, ["a pair of loafers"]),
 "heels": ("shoes", BOTH, ["a pair of high heels", "a pair of heeled shoes"]),
 "sandals": ("shoes", None, ["a pair of sandals"]),
 "khussa": ("shoes", DESI, ["a pair of khussa, embroidered South Asian slip-on shoes with a pointed toe"]),
 "boots": ("shoes", BOTH, ["a pair of boots", "a pair of ankle boots"]),
 "handbag": ("bag", BOTH, ["a handbag", "a leather handbag"]),
 "tote": ("bag", BOTH, ["a tote bag"]),
 "crossbody": ("bag", BOTH, ["a crossbody bag with a long strap", "a leather satchel"]),
 "clutch": ("bag", BOTH, ["a small clutch purse"]),
 "backpack": ("bag", BOTH, ["a backpack"]),
 "dupatta": ("accessory", DESI, ["a long dupatta shawl"]),
 "jewellery": ("accessory", BOTH, ["a piece of jewellery", "a necklace and earrings"]),
 "belt": ("accessory", BOTH, ["a belt"]),
}

STYLES = {
 "desi": ["a South Asian embroidered garment", "a Pakistani or Indian outfit piece"],
 "western": ["a Western garment", "a plain Western fashion piece"],
}

import math

MARGIN = 0.01
SCALE = 100.0

def pooled(scores):
    top = max(scores)
    return top + math.log(sum(math.exp(SCALE * (s - top)) for s in scores)) / SCALE

def recognize(kinds, styles, margin=MARGIN):
    groups = {}
    for kind, score in kinds.items(): groups.setdefault(KINDS[kind][0], []).append(score)
    category_scores = {category: pooled(scores) for category, scores in groups.items()}
    category_rank = sorted(category_scores, key=category_scores.get, reverse=True)
    category = category_rank[0]
    inside = sorted((k for k in kinds if KINDS[k][0] == category), key=kinds.get, reverse=True)
    kind = inside[0]
    fixed = KINDS[kind][1]
    style_rank = sorted(styles, key=styles.get, reverse=True)
    def close(scores, rank): return not rank or (len(rank) > 1 and scores[rank[0]] - scores[rank[1]] < margin)
    question = ("category" if close(category_scores, category_rank) else
                "subcategory" if close(kinds, inside) else
                "style" if not fixed and close(styles, style_rank) else None)
    return category, kind, fixed or style_rank[:1], question
