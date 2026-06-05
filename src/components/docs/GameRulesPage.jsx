import React from 'react';
import '../../assets/css/rules.css';
import { PAWN_TYPES } from '../../constants/pawnTypes';
import coverImg from '../../assets/img/Cover_01_1k.jpg';
import titleImg from '../../assets/img/Title_1k.jpg';

// Icons for Pawns
import vampireIcon from '../../assets/icons/vampire_128x128.png';
import werewolfIcon from '../../assets/icons/warewolf_128x128.png';
import ghostIcon from '../../assets/icons/ghost_128x128.png';
import bardakIcon from '../../assets/icons/bardak_128x128.png';
import jakubIcon from '../../assets/icons/jakub_128x128.png';

// High-Res Portraits
import vampirePortrait from '../../assets/icons/general_vampire_raw.jpg';
import werewolfPortrait from '../../assets/icons/general_warewolf_raw.jpg';
import ghostPortrait from '../../assets/icons/general_ghost_raw.jpg';
import bardakPortrait from '../../assets/icons/general_bardak_raw.jpg';
import jakubPortrait from '../../assets/icons/general_jakub_raw.jpg';

// Screenshots for Examples
import eventExampleImg from '../../assets/img/event_popup.png';
import boardEmptyImg from '../../assets/img/board_empty.png';
import jakubPanelImg from '../../assets/img/jakub_panel.png';
import pawnsTotalPanelImg from '../../assets/img/pawns_total_panel.png';
import setPlayer1Img from '../../assets/img/set_player_1.png';
import setPlayer2Img from '../../assets/img/set_player_2.png';
import setPlayer3Img from '../../assets/img/set_player_3.png';
import boardDistanceExampleImg from '../../assets/img/board_distance_example.png';

const GameRulesPage = () => {
  return (
    <div className="rulebook-wrapper">
      <div className="rulebook-cover-container">
        <img src={coverImg} alt="Game Cover" className="rulebook-cover-bg" />
      </div>

      <header className="rulebook-header">
        <button 
          className="no-print" 
          onClick={() => window.history.back()}
          style={{ float: 'left', background: '#2c3e50', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
        >
          ← Wstecz
        </button>
        <button 
          className="no-print" 
          onClick={() => window.print()}
          style={{ float: 'right', background: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
        >
          Eksportuj do PDF
        </button>
        
        <div className="rulebook-title-header-container">
          <img src={titleImg} alt="AMMENNY ZAJAZD NA STARYM MAJDANIE" className="rulebook-title-img" />
        </div>
        <p>Oficjalne Zasady Gry - Edycja Kolekcjonerska</p>
      </header>

      <div className="rulebook-full-width">
        <section className="rule-section">
          <h2>1. Fabuła: Spotkanie w Trzewiach PGR-u</h2>
          <p className="flavor-text">
            "Gdzieś głęboko pod fundamentami zrujnowanego PGR-u, na końcu korytarza, którego ściany pokrywał grzyb o inteligencji wyższej niż połowa zgromadzonego tam towarzystwa, kopciły się pochodnie ze szmat nasączonych przepracowanym olejem napędowym. W komnacie, która kiedyś służyła za magazyn nawozów sztucznych, a teraz stała się Sztabem Generalnym Ciemności, przy stole skleconym z drzwi od stodoły, spotkały się największe plugastwa doczesnego świata."
          </p>
          <p>
            Na kawałku starego linoleum, węglem kreślono mapę <strong>Starego Majdanu</strong>. Atmosfera była gęsta od oparów zacieru, smrodu mokrej sierści i wiekowego próchna. Sojusz był kruchy, ale nienawiść do Jakuba – wspólna i niezmierna.
          </p>
          <p>
            Jako Hersztowie musicie teraz przeprowadzić ten zmasowany atak, zanim wzejdzie słońce, a bimber przestanie działać.
          </p>
        </section>

        <section className="rule-section">
          <h2>2. Osoby Dramatu (Hersztowie)</h2>
          <div className="generals-grid">
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={vampirePortrait} alt="Vampire General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>Baron von Próchno (Wampiry)</strong>
                <p>Czwartorzędny arystokrata, którego peleryna pamięta czasy potopu szwedzkiego. Cierpi na chroniczną anemię, bo w Wojsławicach nawet krowy mają zbyt mało hemoglobiny. Zamiast szlachetnej krwi pija głównie to, co uda mu się odcedzić z przeterminowanej kaszanki.</p>
              </div>
            </div>
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={werewolfPortrait} alt="Werewolf General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>Buras „Fafik” Rozszarp-Płot (Wilkołaki)</strong>
                <p>Wygląda jak zmokły dywan z czasów PRL-u. Jego „wilcza natura” objawia się głównie obsesyjnym drapaniem się za uchem i panicznym strachem przed rzuconym kapciem. W pełnię zazwyczaj kłóci się z łańcuchem u sąsiada.</p>
              </div>
            </div>
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={ghostPortrait} alt="Ghost General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>Bezcieleśny Czesiek (Duchy)</strong>
                <p>Duch byłego traktorzysty. Zamiast ektoplazmy wydziela zapach spalonego węgla brunatnego i tanich papierosów. Jest tak mało straszny, że miejscowe myszy używają go jako darmowej klimatyzacji.</p>
              </div>
            </div>
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={bardakPortrait} alt="Bardak General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>Izydor Bardak z Wojsławic (Bardaki)</strong>
                <p>Nestor klanu o skórze w kolorze starego boczku. W posklejanej brodzie trzyma zapasowe uszczelki do aparatury i pół bochenka chleba na czarną godzinę. Jego spojrzenie jest równie mętne jak jego najlepszy wyrób.</p>
              </div>
            </div>
            <div className="general-card special-jakub">
              <div className="general-portrait-container">
                <img src={jakubPortrait} alt="Jakub Wędrowycz" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>Jakub Wędrowycz (Egzorcysta Amator)</strong>
                <p>Gospodarz i główna przeszkoda. Stary bimbrownik, egzorcysta i morderca potworów. Nie lubi gości, zwłaszcza tych, którzy depczą mu po grządkach bimbru. Jego siekiera jest równie ostra, co jego dowcip.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="rulebook-full-width">
        <section className="rule-section">
          <h2>3. Elementy Gry</h2>
          <ul>
            <li>
              <strong>Plansza:</strong> Siatka 6x6 regionów, na której toczy się walka.
              <div className="element-example">
                <img src={boardEmptyImg} alt="Plansza" className="rule-screenshot" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            </li>
            <li>
              <strong>Zastępy plugastw Nocy:</strong> Wampiry, Wilkołaki, Duchy oraz Bardaki walczące o dominację.
              <div className="element-example" style={{ marginTop: '10px' }}>
                <div className="pawn-showcase">
                  <div className="pawn-showcase-item">
                    <img src={vampireIcon} alt="Vampire Pawn" />
                    <span>Wampiry</span>
                  </div>
                  <div className="pawn-showcase-item">
                    <img src={werewolfIcon} alt="Werewolf Pawn" />
                    <span>Wilkołaki</span>
                  </div>
                  <div className="pawn-showcase-item">
                    <img src={ghostIcon} alt="Ghost Pawn" />
                    <span>Duchy</span>
                  </div>
                  <div className="pawn-showcase-item">
                    <img src={bardakIcon} alt="Bardak Pawn" />
                    <span>Bardaki</span>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <strong>Zestawy (Taktyczne Oddziały Szturmowe):</strong> Pojedyncze małe taktyczne oddziały szturmowe składające się z członków różnych band. Za wystawienie takiego oddziału na planszę hersztowie poszczególnych band otrzymują punkty zwycięstwa.
              <div className="element-example" style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                <img src={setPlayer1Img} alt="Zestaw 1" className="rule-screenshot" style={{ maxWidth: '30%', height: 'auto' }} />
                <img src={setPlayer2Img} alt="Zestaw 2" className="rule-screenshot" style={{ maxWidth: '30%', height: 'auto' }} />
                <img src={setPlayer3Img} alt="Zestaw 3" className="rule-screenshot" style={{ maxWidth: '30%', height: 'auto' }} />
              </div>
            </li>
            <li>
              <strong>Jakub:</strong> Unikalny pionek, który niszczy wszystko na swojej drodze.
              <div className="element-example" style={{ textAlign: 'center', marginTop: '10px' }}>
                <img src={jakubIcon} alt="Ikona Jakuba" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              </div>
            </li>
            <li>
              <strong>Panel Jakuba:</strong> Boczny panel zarządzania statystykami i furią Jakuba Wędrowycza.
              <div className="element-example" style={{ textAlign: 'center', marginTop: '10px' }}>
                <img src={jakubPanelImg} alt="Panel Jakuba" className="rule-screenshot" style={{ maxWidth: '280px', height: 'auto' }} />
              </div>
            </li>
            <li>
              <strong>Panel posiłków Band:</strong> Panel wskazujący limit i stan pionków poszczególnych band na planszy.
              <div className="element-example" style={{ textAlign: 'center', marginTop: '10px' }}>
                <img src={pawnsTotalPanelImg} alt="Panel posiłków Band" className="rule-screenshot" style={{ maxWidth: '280px', height: 'auto' }} />
              </div>
            </li>
            <li>
              <strong>Wydarzenia:</strong> Losowe efekty zmieniające zasady gry co rundę.
              <div className="element-example">
                <img src={eventExampleImg} alt="Przykładowe Wydarzenie" className="rule-screenshot" />
                <p className="caption">Rycina 2: Okno wydarzenia z opisem efektów.</p>
              </div>
            </li>
          </ul>
        </section>

        <section className="rule-section">
          <h2>4. Przebieg Rund i Mechanika Zestawów</h2>
          <p>Gra trwa <strong>12 rund</strong>. Każda runda składa się z pięciu faz:</p>

          <h3>Główne pojęcia</h3>

          <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22', marginBottom: '15px' }}>
            <h4>Geometria Planszy (Sąsiedztwo i Odległość)</h4>
            <ul>
              <li><strong>Sąsiedztwo:</strong> Dwa sektory sąsiadują ze sobą, jeśli stykają się wspólną krawędzią (bokiem) lub wspólnym rogiem. Sektory mogą mieć od 3 do 8 sąsiednich sektorów.</li>
              <li><strong>Odległość:</strong> Odległość między sektorami mierzona jest w krokach. Przejście do dowolnego sąsiadującego sektora — w pionie, poziomie lub na ukos (po skosie) — zajmuje dokładnie 1 krok. Odległość między dwoma polami to najmniejsza liczba takich kroków, by dotrzeć z jednego do drugiego.</li>
              <li><strong>Odległość od Jakuba:</strong> Dystans mierzony w krokach między polem, na którym stoi Jakub, a sektorem docelowym, w którym umieszczany jest zestaw.</li>
            </ul>
            <div className="element-example" style={{ marginTop: '20px', textAlign: 'center' }}>
              <img src={boardDistanceExampleImg} alt="Przykłady odległości" className="rule-screenshot" style={{ maxWidth: '100%', height: 'auto' }} />
              <p className="caption">Przykłady odległości. Wampir jest w regionie z Jakubem czyli jest w odległości 0. Wilkołaki są w odległości 1, Duchy są w odległości 2, Bardaki są w odległości 3.</p>
            </div>
          </div>

          <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22', marginBottom: '15px' }}>
            <h4>Hierarchia Band (Starszeństwo)</h4>
            <p>Rozstrzyga wszelkie sytuacje remisu w grze. Starszeństwo band od najwyższego do najniższego:</p>
            <p className="hierarchy" style={{ textAlign: 'center', margin: '10px 0' }}><strong>Wampiry &gt; Wilkołaki &gt; Duchy &gt; Bardaki</strong></p>
          </div>

          <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22', marginBottom: '15px' }}>
            <h4>Zasada Remisu</h4>
            <p>W przypadku remisu (np. przy rozstrzyganiu punktów, wyborze celów Jakuba lub na koniec gry), postępujemy według <strong>Hierarchii Band</strong>.</p>
          </div>

          <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22', marginBottom: '15px' }}>
            <h4>Furia (Gniew Jakuba)</h4>
            <p>Wskaźnik określający poziom agresji Jakuba wobec danej bandy. Każdy zlikwidowany przez niego pionek danej bandy zmniejsza furię na tę bandę o 1. Gdy furia spadnie do 0, Jakub przestaje ją ścigać i atakować. Oznacza to, że wartość furii wyznacza maksymalną liczbę pionków danej bandy, jaką Jakub może zabić w danej rundzie.</p>
          </div>
          <div className="phase-card">
            <h3>I. Przygotowanie (Początek Gry i Rund)</h3>
            <p>W <strong>pierwszej rundzie</strong> kolejność graczy jest ustalana losowo, a każdy gracz zaczyna z <strong>20 punktami</strong>. Ostatni gracz decyduje, gdzie wewnątrz planszy pojawia się Jakub.</p>
            <p>Na początku każdej rundy gracze dobierają <strong>3 zestawy</strong>, a Jakub 2 (zasilające jego furię).</p>
          </div>

          <div className="phase-card">
            <h3>II. Faza Hersztów (Wybór Dowództwa)</h3>
            <p>Na początku tej fazy wszyscy dotychczasowi Hersztowie wracają do wspólnej puli wyboru. Następnie gracze ustalają kolejność na podstawie bieżących punktów zwycięstwa. W odwrotnej kolejności – od gracza z najmniejszą liczbą punktów (ostatniego) do lidera (pierwszego) – każdy wybiera jednego wolnego Herszta (bandę). Wybrany Herszt decyduje o tym, za pionki której bandy gracz będzie otrzymywał punkty chwały (przy wystawianiu zestawów) lub tracił je (w przypadku czystki Jakuba) w bieżącej rundzie.</p>
          </div>

          <div className="phase-card">
            <h3>III. Faza Graczy</h3>
            <p>Gracze wykonują swoje tury w <strong>normalnej kolejności</strong>. W swojej turze możesz wykonać jedną akcję:</p>
            <ul>
              <li><strong>Wystawienie zestawu:</strong> Kładziesz pionki na planszy (zestawy można wystawiać <strong>wyłącznie do pustych sektorów</strong>). Aby móc wystawić zestaw, w puli posiłków musi znajdować się wystarczająca liczba pionków danej bandy, aby całkowicie skompletować oddział. W przeciwnym razie zagranie takiego zestawu jest niedozwolone. Punkty zdobywają wszyscy Hersztowie za każdą jednostkę swojej bandy w tym zestawie.</li>
              <li><strong>Podkablowanie Jakubowi:</strong> Przekazujesz (podkablujesz) zestaw Jakubowi w tajemnicy, zyskując natychmiast <strong>1 punkt</strong>. Zestaw ten zasili furię Jakuba na konkretną bandę (furia rośnie za każdy pionek danej bandy znajdujący się w tym zestawie).</li>
              <li><strong>Pasowanie:</strong> Rezygnujesz z dalszych akcji w tej rundzie.</li>
            </ul>
            <p>Faza kończy się, gdy wszyscy gracze spasują.</p>
          </div>

          <div className="phase-card">
            <h3>IV. Faza Jakuba</h3>
            <p>Jakub "upuszcza pary" wykonując swój morderczy taniec (patrz pkt 5). Zabija jednostki i traci furię.</p>
          </div>

          <div className="phase-card">
            <h3>V. Faza Wydarzeń</h3>
            <p>Odkrywamy wydarzenie, które wpływa na obecny stan planszy.</p>
          </div>
        </section>

        <section className="rule-section">
          <h2>5. Punktacja Band (Wystawianie)</h2>
          


          <div className="scoring-rules">
            <p className="scoring-intro">
              Mechanizm zdobywania Punktów Chwały jest unikalny dla każdej bandy i wymaga od Hersztów elastyczności taktycznej. Kluczem do sukcesu jest strategiczne rozmieszczenie pionków z posiadanych zestawów na planszy. Ostateczna wartość nagrody zależy od specyfiki wybranego sektora oraz jego bezpośredniej bliskości (liczonej najkrótszą drogą przez pola sąsiednie) względem aktualnej pozycji Jakuba.
            </p>
            <p><strong>Wampiry (V):</strong> Punkty = <code>(4 - odległość) * liczba wampirów</code>. Przy maksymalnej odległości równej 5 punkty za wampiry są ujemne (<code>-1</code> za każdego wampira).</p>
            <p><strong>Wilkołaki (W):</strong> Punkty = <code>floor(suma_wilkołaków / 3) + 1</code>. Bonus +1, jeśli odległość od Jakuba wynosi 0 lub 1.</p>
            <p><strong>Duchy (G):</strong> Punkty = <code>(2 - odległość do najbliższej krawędzi) * liczba duchów</code>. Kara <code>-1</code> za każdego ducha, jeśli region jest w zasięgu Jakuba (kara może sprawić, że punkty staną się ujemne).</p>
            <p><strong>Bardaki (B):</strong> Punkty = <code>liczba Bardaków</code>. Jeśli region jest w odległości 0 lub 1 od Jakuba (wliczając skosy / odległość ≤ 1), Bardaki otrzymują <strong>0 punktów</strong> za każdego Bardaka w zestawie.</p>
          </div>
        </section>

        <section className="rule-section">
          <h2>6. Furia i Łowy Jakuba</h2>
          <p>
            Jakub nie jest cierpliwym człowiekiem. Jego <strong>Furia</strong> kumuluje się podczas innych faz gry (np. gdy wchłania zestawy w fazie przygotowania lub gdy gracze podkablują nim Jakubowi).
          </p>
          <ul>
            <li><strong>Zasięg:</strong> Bazowo 1, rośnie o +1 za każdą bandę z Furią ≥ 10.</li>
            <li><strong>Czystka:</strong> Jakub zabija pionki według hierarchii gniewu, uspokajając się z każdym ciosem (-1 Furii za pionka).</li>
            <li><strong>Ruch:</strong> Szuka najliczniejszego celu w zasięgu. Przy remisie wybiera pole z największą sumą jednostek, a przy ostatecznym remisie decyduje <strong>Lider</strong>.</li>
          </ul>
        </section>

        <section className="rule-section">
          <h2>7. Koniec Gry i Punktacja Końcowa</h2>
          <p>W <strong>12. rundzie</strong>, po zakończeniu Fazy Jakuba, nie następuje Faza Eventu. Zamiast niej przeprowadzana jest <strong>Punktacja Końcowa</strong>, która wyłoni ostatecznego zwycięzcę.</p>
          
          <div className="scoring-box">
            <h3>Bonusy Band (Runda 12):</h3>
            <ul>
              <li><strong>Wampiry:</strong> +2 pkt za każdy region na planszy, w którym znajduje się przynajmniej jeden Wampir.</li>
              <li><strong>Wilkołaki:</strong> +1 pkt za każdą jednostkę Wilkołaka pozostającą na planszy.</li>
              <li><strong>Duchy:</strong> +2 pkt za każdy region, w którym Duchy są jedyną bandą; +1 pkt za każdy inny region, w którym mają Przewagę.</li>
              <li><strong>Bardaki:</strong> +1 pkt za każdy region, w którym mają Przewagę (więcej jednostek niż jakakolwiek inna pojedyncza banda).</li>
            </ul>
          </div>

          <p>Wygrywa gracz, który zgromadzi łącznie najwięcej Punktów Chwały.</p>
          
          <div className="tie-breaker-box warning">
            <h3>Zasada Remisu:</h3>
            <p>Jeżeli na koniec gry dwóch lub więcej graczy posiada identyczną liczbę punktów, postępujemy według <strong>Hierarchii Band</strong>.</p>
          </div>
        </section>
      </div>

      <footer className="rulebook-footer">
        © 2026 Wędrowycz-Gemini Project - Professional Rulebook v1.11.0 | Jakub approves.
      </footer>
    </div>
  );
};

export default GameRulesPage;
