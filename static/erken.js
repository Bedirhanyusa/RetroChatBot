// Sayfa ilk boyanmadan önce kayıtlı çağı uygula (yanıp sönmeyi önler).
// CSP satır içi betiğe izin vermediği için ayrı dosyada.
(function () {
    var cag = "1997", giris = false;
    try {
        var url = new URLSearchParams(location.search).get("cag");
        cag = url === "2030" || url === "1997" ? url : (localStorage.getItem("cag") || "1997");
        giris = cag === "1997" && !sessionStorage.getItem("giris");
    } catch (e) {}
    if (cag === "2030") document.body.classList.add("modern");
    if (giris) document.body.classList.add("giris-var");
})();
