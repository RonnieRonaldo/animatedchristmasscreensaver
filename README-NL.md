# Animated Christmas Screensaver — Light Winter

De openbare verkooppagina en korte echte productpreview zijn klaar. De website is nog niet op GitHub of Cloudflare geplaatst vanuit deze sessie. Er zijn nog geen echte betalingen verwerkt. De koppeling vereist onderstaande accountinstellingen.

## Wat in dit pakket zit

- Eén Engelstalige verkooppagina, 445 woorden in het hoofdgedeelte, één H1 en vijf H2's.
- Exacte H1 en eerste zin uit de opdracht; paginatitel en metaomschrijving beginnen met de zoekterm.
- Canonieke URL: https://animatedchristmasscreensaver.com/animated-christmas-screensaver
- Light Winter: wit, ijsblauw, donkerblauw en rode koopknoppen.
- Echte productafbeelding en 18 seconden MP4-preview uit de actuele animatiebron (scènes 15, 37 en 41). De preview heeft geen geluid.
- Web3Forms-contactformulier uit warhammerdiorama-main.zip, vertaald naar Engels. De bestaande formuliercode blijft gebruikt; controleer in Web3Forms of het nieuwe domein wordt toegestaan.
- Analytics voorbereid, maar geen Google-meet-ID ingevuld en geen oude code overgenomen.
- Cloudflare Pages Worker voor Paddle-checkout, verificatie en beschermde productbestanden.
- Tests voor geweigerde toegang, vervalste cookies, verkeerde oorsprong, verkeerde aankoop en succesvolle serververificatie.

**Geen volledige animatiebestanden in dit pakket of de openbare GitHub-repository.** De bestaande Kerst Video is niet gewijzigd. De actuele bron is commit `03a9b50ce9a124cde62cd53570152d605e224b03`, met 41 scènes. Scène 41 staat in `scenes/list-unroll-prepared` en heeft vooraf ingestelde tekst.

## 1. Naar GitHub

Open RonnieRonaldo/animatedchristmasscreensaver. Pak dit ZIP-bestand uit en upload de inhoud (public, tests, package.json, wrangler.toml en dit document) naar de hoofdmap van de repository. Upload niet de ZIP zelf. Er is geen installatiestap of framework nodig.

Als de repository al bestanden bevat: behoud bestaande account- en domeininstellingen; voeg deze bestanden gericht toe. Er zijn in deze sessie geen bestaande GitHub-bestanden overschreven.

## 2. Koppel Cloudflare Pages

1. Open Cloudflare, Workers & Pages, en maak een Pages-project via Git.
2. Kies GitHub en de repository RonnieRonaldo/animatedchristmasscreensaver.
3. Productiebranch: main (of de daadwerkelijke standaardbranch).
4. Framework preset: None. Build command: leeg. Build output directory: public. Root directory: leeg.
5. Sla op en deploy. Het bestand public/_worker.js wordt als Pages advanced-mode Worker gebruikt.
6. Open het project, Custom domains, Set up a custom domain. Voeg animatedchristmasscreensaver.com toe en volg Cloudflare's DNS-instructies bij de huidige DNS-beheerder. Voeg eventueel www toe en stuur die naar het hoofddomein.
7. Test /animated-christmas-screensaver, /assets/christmas-preview.mp4 en het contactformulier. De homepage verwijst naar de gevraagde slug.

## 3. Het betaalde product privé klaarzetten

Maak een private Cloudflare R2-bucket. Laat de openbare r2.dev-toegang en publieke custom domains uitgeschakeld. Upload de **inhoud** van de actuele dist-map van Kerst Video, met behoud van de mappenstructuur: index.html, shared/, scenes/ enzovoort. Niet de map dist zelf als extra bovenliggende map.

Voeg in Pages > Settings > Bindings een R2-binding toe, met de variabelenaam **PRODUCT**, gekoppeld aan die bucket. Deploy opnieuw.

Alle productbestanden worden uitsluitend via `/experience/` geleverd nadat de server de ondertekende toegangscookie heeft gecontroleerd. Ook JavaScript, afbeeldingen, lettertypen en audio achter deze route vereisen toegang. Alleen de korte marketingpreview en poster zijn openbaar.

Let op: de actuele bron bevat de bestaande collectie met 41 afzonderlijke scènes. Dit pakket maakt daar niet automatisch een nieuwe lange doorlopende film van. Een koper krijgt de bestaande browserervaring; de preview is een korte samengestelde video.

## 4. Paddle voorbereiden

Maak voor dit ene product een eenmalige prijs in Paddle. Keur het domein goed en stel als default payment link in:
https://animatedchristmasscreensaver.com/animated-christmas-screensaver

Voeg onderstaande variabelen toe in Cloudflare Pages > Settings > Variables and Secrets. Bewaar geheimen uitsluitend daar, nooit in GitHub of in frontend-JavaScript.

| Naam | Waarde |
| --- | --- |
| CHECKOUT_ENABLED | Eerst false; pas true na configuratie en sandboxcontrole |
| PADDLE_ENV | sandbox voor tests; production voor echt |
| PADDLE_PRICE_ID | De pri_… prijs van dit product |
| PADDLE_CLIENT_TOKEN | De client-side token uit dezelfde Paddle-omgeving |
| PADDLE_API_KEY | Secret, met transaction.read en transaction.write |
| ACCESS_SECRET | Secret: een willekeurige waarde van minimaal 32 tekens |
| DISPLAY_PRICE | Gewenste zichtbare prijs, passend bij Paddle; weglaten als prijs alleen in checkout wordt getoond |
| GA_MEASUREMENT_ID | Leeg laten tot de nieuwe G-… code beschikbaar is |

Deploy na wijziging van bindings/variabelen opnieuw. De drie koopknoppen zijn technisch voorbereid, maar blijven zonder complete configuratie in de status 'Checkout is being prepared'. Er is geen fictieve prijs ingevuld.

De server maakt een Paddle-transactie met een willekeurige browsergebonden aankoopcode. Na checkout controleert hij via de Paddle API de status completed, de juiste prijs en de aankoopcode. Pas daarna volgt toegang. Alleen een checkout-event of kennis van een transactie-ID geeft dus geen toegang.

Toegang wordt in dezelfde browser bewaard met een HttpOnly/Secure-cookie (technische looptijd één jaar). Wis je cookies of gebruik je een ander apparaat, dan is hulp nodig; herstelmail volgt later. Automatische intrekking na restituties/chargebacks en langdurig accountherstel zijn nog niet geïmplementeerd. Bepaal de definitieve toegangsduur en verkoopvoorwaarden voordat de verkoop wordt geopend. Voeg benodigde bedrijfs- en verkoopinformatie toe voor Paddle's domeincontrole; die is niet verzonnen in deze versie.

## 5. Controle voor echte verkoop

- Voer een sandboxaankoop uit en controleer dat de juiste prijs wordt getoond.
- Controleer dat productbestanden zonder aankoop niet openen, en na de aankoop wel.
- Test heropenen via My access, de teksten in scène 41 en geluid op echte apparaten.
- Controleer dat Web3Forms de berichten ontvangt; er is geen testbericht namens Ronald verstuurd.
- Controleer live Paddle-goedkeuring en gebruik voor productie uitsluitend live-credentials.
- Echte betaling en toegang konden hier niet end-to-end worden getest: accountconfiguratie ontbreekt nog.

## Broncontrole en tests

`npm test` draait de vier servertoegangstests met gesimuleerde Paddle-responses. `public/assets/site.js` laadt geen analytics zolang de nieuwe meet-ID ontbreekt. De volledige betaalde scène-assets mogen nooit in public/ belanden.

Documentatie:
https://developers.cloudflare.com/pages/get-started/git-integration/
https://developers.cloudflare.com/pages/functions/bindings/
https://developer.paddle.com/build/transactions/create-transaction/
https://developer.paddle.com/paddle-js/methods/paddle-checkout-open/
