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
import setExampleImg from '../../assets/img/set_example_1.png';
import eventExampleImg from '../../assets/img/event_popup.png';

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
            Jako Generałowie musicie teraz przeprowadzić ten zmasowany atak, zanim wzejdzie słońce, a bimber przestanie działać.
          </p>
        </section>

        <section className="rule-section">
          <h2>2. Osoby Dramatu (Generałowie)</h2>
          <div className="generals-grid">
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={vampirePortrait} alt="Vampire General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>Baron von Próchno (Vampiry)</strong>
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

      <div className="rulebook-columns">
        <section className="rule-section">
          <h2>3. Elementy Gry</h2>
          <p>W walce biorą udział następujące jednostki (pionki):</p>
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
            <div className="pawn-showcase-item special">
              <img src={jakubIcon} alt="Jakub Pawn" />
              <span>Jakub Wędrowycz</span>
            </div>
          </div>
          <ul>
            <li><strong>Plansza:</strong> Siatka 6x6 regionów, na której toczy się walka.</li>
            <li>
              <strong>Zestawy (Sets):</strong> Karty zawierające kombinacje pionków o różnej mocy.
              <div className="element-example">
                <img src={setExampleImg} alt="Przykładowy Zestaw" className="rule-screenshot" />
                <p className="caption">Rycina 1: Przykładowy zestaw jednostek (Vampiry i Duchy).</p>
              </div>
            </li>
            <li><strong>Jakub:</strong> Unikalny pionek, który niszczy wszystko na swojej drodze.</li>
            <li>
              <strong>Wydarzenia (Events):</strong> Losowe efekty zmieniające zasady gry co rundę.
              <div className="element-example">
                <img src={eventExampleImg} alt="Przykładowe Wydarzenie" className="rule-screenshot" />
                <p className="caption">Rycina 2: Okno wydarzenia z opisem efektów.</p>
              </div>
            </li>
          </ul>
        </section>

        <section className="rule-section">
          <h2>3. Przebieg Rund i Mechanika Zestawów</h2>
          <p>Gra trwa <strong>12 rund</strong>. Każda runda składa się z pięciu faz:</p>
          
          <div className="mechanic-box">
            <h3>Mechanika Zestawów (Sets)</h3>
            <p>Zestawy jednostek zarządzane są poprzez Pule Dobierania i Odrzuconą. Gdy Pula Dobierania się wyczerpie, następuje przetasowanie.</p>
          </div>

          <div className="phase-card">
            <h3>I. Setup (Początek Gry i Rund)</h3>
            <p>W <strong>pierwszej rundzie</strong> kolejność graczy jest ustalana losowo. Ostatni gracz decyduje, gdzie wewnątrz planszy pojawia się Jakub.</p>
            <p>Na początku każdej rundy gracze dobierają <strong>3 zestawy</strong>, a Jakub 2 (zasilające jego gniew).</p>
          </div>

          <div className="phase-card">
            <h3>II. Faza Generałów (Ustalanie Kolejności)</h3>
            <p>Kolejność graczy jest ustalana na podstawie aktualnej liczby punktów (Gracz z największą liczbą punktów zostaje <strong>Pierwszym Graczem</strong>).</p>
            <p>Następnie, w <strong>odwrotnej kolejności</strong> (od gracza z najmniejszą liczbą punktów), każdy wybiera nację, którą chce dowodzić w tej rundzie.</p>
          </div>

          <div className="phase-card">
            <h3>III. Faza Graczy</h3>
            <p>Gracze wykonują swoje tury w <strong>normalnej kolejności</strong>. W swojej turze możesz wykonać jedną akcję:</p>
            <ul>
              <li><strong>Wystawienie zestawu:</strong> Kładziesz pionki na planszy. Punkty zdobywają wszyscy Generałowie za każdą jednostkę swojej nacji w tym zestawie.</li>
              <li><strong>Oddanie zestawu Jakubowi:</strong> Przekazujesz zestaw Jakubowi w tajemnicy, zyskując natychmiast <strong>1 punkt</strong>. Zestaw ten zasili furię Jakuba w jego fazie.</li>
              <li><strong>Pasowanie:</strong> Rezygnujesz z dalszych akcji w tej rundzie.</li>
            </ul>
            <p>Faza kończy się, gdy wszyscy gracze spasują.</p>
          </div>

          <div className="phase-card">
            <h3>IV. Faza Jakuba</h3>
            <p>Jakub "upuszcza pary" wykonując swój morderczy taniec (patrz pkt 5). Zabija jednostki i traci gniew.</p>
          </div>

          <div className="phase-card">
            <h3>V. Faza Eventu</h3>
            <p>Losowane jest wydarzenie, które modyfikuje stan planszy, gniew Jakuba lub zasady gry przed kolejną rundą.</p>
          </div>
        </section>

        <section className="rule-section">
          <h2>4. Punktacja Nacji (Wystawianie)</h2>
          
          <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22' }}>
            <h3>4.1 Geometria Planszy: Odległość i Sąsiedztwo</h3>
            <p>Wiele zasad punktacji i ruchu opiera się na pojęciu <strong>Sąsiedztwa</strong> oraz <strong>Odległości</strong>:</p>
            <ul>
              <li><strong>Sąsiedztwo (Adjacency):</strong> Dwa regiony sąsiadują ze sobą, jeśli stykają się bokiem lub rogiem (tzw. ruch króla szachowego). Każdy środkowy region posiada 8 sąsiadów.</li>
              <li><strong>Odległość (Distance):</strong> Odległość między polami to minimalna liczba ruchów, jakie musi wykonać król szachowy, by przejść z jednego pola na drugie. Oznacza to, że ruch po skosie liczy się jako 1 jednostka odległości, tak samo jak ruch w pionie czy poziomie.</li>
              <li><strong>Odległość od Jakuba:</strong> Jest to dystans mierzony od pola, na którym aktualnie stoi Jakub, do pola docelowego, na którym stawiasz zestaw pionków.</li>
            </ul>
          </div>

          <div className="scoring-rules">
            <p className="scoring-intro">
              Mechanizm zdobywania Punktów Chwały jest unikalny dla każdej nacji i wymaga od Generałów elastyczności taktycznej. Kluczem do sukcesu jest strategiczne rozmieszczenie pionków z posiadanych zestawów na planszy. Ostateczna wartość nagrody zależy od specyfiki wybranego sektora oraz jego bezpośredniej bliskości (liczonej najkrótszą drogą przez pola sąsiednie) względem aktualnej pozycji Jakuba.
            </p>
            <p><strong>Wampiry (V):</strong> Punkty = 4 - odległość od Jakuba.</p>
            <p><strong>Wilkołaki (W):</strong> Punkty = floor(suma_wilkołaków / 3) + 1. Bonus +1, jeśli Jakub jest blisko.</p>
            <p><strong>Duchy (G):</strong> Punkty zależne od bliskości krawędzi planszy (max 2). Kara -1, jeśli Jakub jest w zasięgu.</p>
            <p><strong>Bardaki (B):</strong> Punkty równe liczbie Bardaków w zestawie. 0 punktów, jeśli Jakub jest zbyt blisko!</p>
          </div>
        </section>

        <section className="rule-section">
          <h2>5. Gniew i Łowy Jakuba</h2>
          <p>
            Jakub nie jest cierpliwym człowiekiem. Jego <strong>Złość (Anger)</strong> kumuluje się podczas innych faz gry (np. gdy wchłania zestawy w fazie Setup lub gdy gracze przekazują mu je w tajemnicy).
          </p>
          <ul>
            <li><strong>Zasięg (Range):</strong> Bazowo 1, rośnie o +1 za każdą nację z Angerem ≥ 10.</li>
            <li><strong>Czystka:</strong> Jakub zabija pionki według hierarchii gniewu, uspokajając się z każdym ciosem (-1 Anger za pionka).</li>
            <li><strong>Ruch:</strong> Szuka najliczniejszego celu w zasięgu. Przy remisie wybiera pole z największą sumą jednostek, a przy ostatecznym remisie decyduje <strong>Lider</strong>.</li>
          </ul>
        </section>

        <section className="rule-section">
          <h2>6. Koniec Gry i Punktacja Końcowa</h2>
          <p>W <strong>12. rundzie</strong>, po zakończeniu Fazy Jakuba, nie następuje Faza Eventu. Zamiast niej przeprowadzana jest <strong>Punktacja Końcowa</strong>, która wyłoni ostatecznego zwycięzcę.</p>
          
          <div className="scoring-box">
            <h3>Bonusy Frakcji (Runda 12):</h3>
            <ul>
              <li><strong>Vampiry:</strong> +2 pkt za każdy region na planszy, w którym znajduje się przynajmniej jeden Wampir.</li>
              <li><strong>Wilkołaki:</strong> +1 pkt za każdą jednostkę Wilkołaka pozostającą na planszy.</li>
              <li><strong>Duchy:</strong> +2 pkt za każdy region, w którym Duchy są jedyną nacją; +1 pkt za każdy inny region, w którym mają Przewagę.</li>
              <li><strong>Bardaki:</strong> +1 pkt za każdy region, w którym mają Przewagę (więcej jednostek niż jakakolwiek inna pojedyncza nacja).</li>
            </ul>
          </div>

          <p>Wygrywa gracz, który zgromadzi łącznie najwięcej Punktów Chwały (VP).</p>
          
          <div className="tie-breaker-box warning">
            <h3>Zasada Remisu:</h3>
            <p>Jeżeli na koniec gry dwóch lub więcej graczy posiada identyczną liczbę punktów, o zwycięstwie decyduje hierarchia starszeństwa nacji dowodzonej w ostatniej rundzie:</p>
            <p className="hierarchy"><strong>Vampiry &gt; Wilkołaki &gt; Duchy &gt; Bardaki</strong></p>
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
