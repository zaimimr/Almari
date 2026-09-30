SAMPLES = {"mauve-hijab":"hijab","ivory-hijab":"hijab","chocolate-hijab":"hijab","ivory-tunic":"tunic","sage-kurta":"kurta","navy-blazer":"blazer","taupe-abaya":"abaya","ivory-trousers":"trousers","charcoal-trousers":"trousers","ivory-salwar":"shalwar","chocolate-loafers":"shoes","taupe-bag":"bag","olive-maxi-dress":"dress"}
WEB = {"abaya-0":"abaya","abaya-2":"abaya","shalwar-0":"shalwar","shalwar-3":"shalwar","blazer-1":"blazer","cardigan-1":"cardigan","loafers-1":"shoes","loafers-2":"shoes","bag-0":"bag","bag-1":"bag","bag-2":"bag","bag-3":"bag","dress-0":"dress","dress-2":"dress","trousers-0":"trousers","trousers-3":"trousers","skirt-3":"skirt","coat-0":"coat","coat-2":"coat","coat-3":"coat","boots-1":"shoes","boots-2":"shoes","boots-3":"boots","top-1":"top","top-3":"top","sneakers-1":"shoes","sneakers-2":"shoes","sneakers-3":"shoes"}
OV = {"scarf-3":"hijab","scarf-5":"hijab","tunic-1":"top","tunic-2":"top","cardigan-1":"cardigan","cardigan-2":"cardigan","kurta-2":"kurta"}
def cases(root):
    out=[]
    for k,v in SAMPLES.items(): out.append((f"{root}/assets/wardrobe/{k}.png", v, "sample"))
    for k,v in WEB.items(): out.append((f"web/{k}.jpg", v, "web"))
    for k,v in OV.items(): out.append((f"ov/{k}.jpg", v, "web"))
    return out
