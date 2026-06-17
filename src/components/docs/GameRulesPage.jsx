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
import jakubPhasePart1Img from '../../assets/img/jakub_phase_example_1_part_1.png';
import jakubPhasePart2Img from '../../assets/img/jakub_phase_example_1_part_2.png';
import jakubPhasePart3Img from '../../assets/img/jakub_phase_example_1_part_3.png';
import jakubPhasePart4Img from '../../assets/img/jakub_phase_example_1_part_4.png';
import jakubPhasePart5Img from '../../assets/img/jakub_phase_example_1_part_5.png';
import scoreExampleVMinus1Img from '../../assets/img/socre_example_v-1_g2_b2.png';
import scoreExampleV8Img from '../../assets/img/socre_example_v8_b0.png';
import scoreExampleW1Img from '../../assets/img/socre_example_w1_b2.png';
import scoreExampleW3Img from '../../assets/img/socre_example_w3.png';
import scoreExampleW3B2Img from '../../assets/img/socre_example_w3_b2.png';
import scoreExampleW4G2Img from '../../assets/img/socre_example_w4_g2.png';

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
        <p>Oficjalne Zasady Gry v1.15.0 - Edycja Kolekcjonerska</p>
      </header>

      <div className="rulebook-full-width">
        <section className="rule-section">
          <h2>Fabuła: Tajne Konszachty w Grobowcu</h2>
          <p className="flavor-text">
            "W ciasnej, zawilgoconej krypcie grobowej lokalnego magnata na wojsławickim cmentarzu panował niemiłosierny ścisk. Próchniejąca trumna służyła za stół konferencyjny, na którym rozłożono mapę Starego Majdanu nabazgraną węglem na kartonie po butach. Wilkołaki ciągle kichały od kurzu i stęchlizny, wampiry narzekały, że nie ma czym oddychać, duchy z powodu wilgoci straciły swoją ektoplazmatyczną puszystość i smętnie wisiały pod sufitem ubolewając nad brakiem zasięgu LTE, a Bardaki po cichu odkręcają mosiężne uchwyty od trumny i kombinują, jak ukraść Baronowi portfel oraz jego zapasowe, posrebrzane zęby."
          </p>
          <p>
            Hersztowie debatowali o północy, jak podejść starca, który zamiast wody święconej używa w swoim arsenale kwasu z akumulatora i przeterminowanego dynamitu. Atmosfera była gęsta od smrodu mokrej sierści, wiekowego próchna i bimbru konkurencji. Sojusz był kruchy, ale nienawiść do Jakuba – wspólna i niezmierna.
          </p>
          <p>
            Jako Hersztowie musicie teraz przeprowadzić ten zmasowany atak, zanim wzejdzie słońce, a bimber w żyłach Waszych wojowników przestanie działać.
          </p>
        </section>

        <section className="rule-section">
          <h2>Osoby Dramatu (Hersztowie)</h2>
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
          <h2>Elementy Gry</h2>
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
          <h2>Przebieg Rund i Mechanika Zestawów</h2>
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
          <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22', marginBottom: '15px' }}>
            <h4>Zasięg Jakuba</h4>
            <p>Zasięg Jakuba to domyślnie sektor w którym stoi i sektory w odległości 1. Odległość ta zwiększana jest o 1 za każdą nację, której poziom Furii &gt; 9. Maksymalny zasięg wynosi 5.</p>
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
              <li><strong>Wystawienie zestawu:</strong> Kładziesz pionki na planszy (zestawy można wystawiać <strong>wyłącznie do sektorów, w których nie ma pionków żadnej bandy</strong> – sektor z samym Jakubem zalicza się jako pusty sektor). Aby móc wystawić zestaw, w puli posiłków musi znajdować się wystarczająca liczba pionków dla każdej z band reprezentowanych w tym zestawie, aby w pełni go skompletować. Jeśli brakuje pionków chociaż jednej z tych band, wystawienie takiego zestawu jest niedozwolone. Punkty zdobywają wszyscy Hersztowie za każdą jednostkę swojej bandy w tym zestawie.</li>
              <li><strong>Podkablowanie Jakubowi:</strong> Przekazujesz (podkablujesz) zestaw Jakubowi jawnie (a nie w tajemnicy), zyskując natychmiast <strong>1 punkt</strong>. Zestaw ten zasili furię Jakuba na konkretne bandy (furia na poszczególne bandy oraz zasięg Jakuba są aktualizowane na bieżąco, za każdy pionek danej bandy znajdujący się w tym zestawie).</li>
              <li><strong>Pasowanie:</strong> Rezygnujesz z dalszych akcji w tej rundzie.</li>
            </ul>
            <p>Faza kończy się, gdy wszyscy gracze spasują.</p>
          </div>

          <div className="phase-card">
            <h3>IV. Faza Jakuba</h3>
            <p>Jakub "upuszcza pary" wykonując swój morderczy taniec (patrz sekcja Furia i Łowy Jakuba). Zabija jednostki i traci furię.</p>
          </div>

          <div className="phase-card">
            <h3>V. Faza Wydarzeń</h3>
            <p>Odkrywamy wydarzenie, które wpływa na obecny stan planszy.</p>
          </div>
        </section>

        <section className="rule-section">
          <h2>Punktacja Band (Wystawianie)</h2>
          


          <div className="scoring-rules">
            <p className="scoring-intro">
              Mechanizm zdobywania Punktów Chwały jest unikalny dla każdej bandy i wymaga od Hersztów elastyczności taktycznej. Kluczem do sukcesu jest strategiczne rozmieszczenie pionków z posiadanych zestawów na planszy. Ostateczna wartość nagrody zależy od specyfiki wybranego sektora oraz jego bezpośredniej bliskości (liczonej najkrótszą drogą przez pola sąsiednie) względem aktualnej pozycji Jakuba.
            </p>
            <p><strong>Wampiry (V):</strong> Punkty = <code>(4 - odległość) * liczba wampirów</code>. Przy maksymalnej odległości równej 5 punkty za wampiry są ujemne (<code>-1</code> za każdego wampira).</p>
            <p><strong>Wilkołaki (W):</strong> Punkty = 1 punkt bazowy + 1 punkt za każde 3 wilkołaki (zaokrąglając w dół) w regionie docelowym i regionach sąsiednich. Bonus +1, jeśli odległość od Jakuba wynosi 0 lub 1.</p>
            <p><strong>Duchy (G):</strong> Punkty = <code>(2 - odległość do najbliższej krawędzi) * liczba duchów</code>. Kara <code>-1</code> za każdego ducha, jeśli region to region z Jakubem lub region sąsiedni (odległość ≤ 1; kara może sprawić, że punkty staną się ujemne).</p>
            <p><strong>Bardaki (B):</strong> Punkty = <code>liczba Bardaków</code>. Jeśli region to region z Jakubem lub region sąsiedni (odległość ≤ 1), Bardaki otrzymują <strong>0 punktów</strong> za każdego Bardaka w zestawie.</p>
          </div>

          <div className="example-screenshots-container" style={{ marginTop: '30px', textAlign: 'center' }}>
            <h5 style={{ fontSize: '1.2em', marginBottom: '20px' }}>Przykłady Punktacji Zestawów:</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '35px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>Przykład 1:</strong>
                <img src={scoreExampleVMinus1Img} alt="Przykładowy Wynik 1" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Zestaw został wystawiony do brzegowego regionu planszy w odległości 5 od Jakuba. Punktacja za Wampiry to 4 - odległość, czyli Herszt Wampirów otrzymuje <strong>-1 punkt</strong>. Herszt Duchów otrzymuje 2 punkty minus odległość do krawędzi; ponieważ jest to region brzegowy: 2 - 0, czyli <strong>2 punkty</strong>. Herszt Bardaków otrzymuje po 1 punkcie za każdego swojego pionka wystawionego na planszę poza regionem z Jakubem i regionami sąsiednimi (odległość &gt; 1). Ponieważ odległość wynosi 5, dostaje 2 x 1, czyli <strong>2 punkty</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>Przykład 2:</strong>
                <img src={scoreExampleV8Img} alt="Przykładowy Wynik 2" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Wampiry zostały umieszczone w regionie z Jakubem, czyli odległość wynosi 0. Herszt Wampirów punktuje po 4 punkty za każdego wampira (4 - 0 = 4 pkt za pionka), co daje <strong>8 pkt</strong>. Herszt Bardaków nie punktuje za Bardaków wystawionych do sektora Jakuba oraz sektorów z nim sąsiadujących, czyli otrzymuje <strong>0 pkt</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>Przykład 3:</strong>
                <img src={scoreExampleW1Img} alt="Przykładowy Wynik 3" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Zestaw został wystawiony w odległości 2 od Jakuba. Herszt Wilkołaków otrzymuje <strong>1 punkt</strong>, ponieważ w regionie docelowym oraz sąsiednich nie ma innych Wilkołaków (za 1 wilkołaka zaokrąglając w dół otrzymuje 0 pkt, plus 1 pkt bazowy = 1 pkt). Nie otrzymuje też dodatkowego bonusowego punktu za bliskość Jakuba (odległość &gt; 1). Herszt Bardaków znajduje się poza regionem z Jakubem i regionami sąsiednimi (odległość &gt; 1), więc otrzymuje po 1 punkcie za każdego Bardaka w zestawie, co daje <strong>2 pkt</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>Przykład 4:</strong>
                <img src={scoreExampleW3Img} alt="Przykładowy Wynik 4" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Zestaw został wystawiony do regionu w odległości 1 od Jakuba. Herszt Bardaków otrzymuje <strong>0 punktów</strong>, ponieważ jest to sektor zagrożony (odległość ≤ 1). Herszt Duchów liczy odległość od krawędzi (wynosi ona 1), więc bazowo otrzymałby 2 - 1 = 1 pkt za ducha, ale z racji tego, że region to region z Jakubem lub region sąsiedni (odległość ≤ 1), naliczana jest kara -1 pkt za każdego ducha, co daje ostatecznie <strong>0 pkt</strong>. Herszt Wilkołaków otrzymuje 1 punkt za wystawionego Wilkołaka, +1 punkt za bliskość Jakuba (odległość ≤ 1), oraz +1 punkt za to, że łącznie w regionie docelowym oraz sąsiednich znajdują się 4 Wilkołaki (za 4 wilkołaki zaokrąglając w dół otrzymuje 1 pkt). Ostatecznie daje to 1 (bazowy) + 1 (za bliskość) + 1 (za 4 wilkołaki) = <strong>3 pkt</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>Przykład 5:</strong>
                <img src={scoreExampleW3B2Img} alt="Przykładowy Wynik 5" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Herszt bardaków nie dostaje żadnych punktów gdyż został wystawiony do regionu z Jakubem lub regionu sąsiedniego (odległość ≤ 1). Herszt wilkołaków dostaje 1 punkt za wystawienie wilkołaka oraz 1 punkt za region z Jakubem lub region sąsiedni (odległość ≤ 1). Następnie zlicza wilkołaki w zasięgu sektora w którym został wystawiony jest ich 6 czyli dodatkowe 2 punkty. Łącznie 4 punkty.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>Przykład 6:</strong>
                <img src={scoreExampleW4G2Img} alt="Przykładowy Wynik 6" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Hersz bardaków 1 punkt gdyż jest to region poza regionem z Jakubem i regionami sąsiednimi (odległość &gt; 1). Obecny sektor jest w odległości 2 od jakuba czyli każdy wampir dostej 4 -2=2pkt czyli łącznie 4pkt
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rule-section">
          <h2>Furia i Łowy Jakuba</h2>
          <p>
            Jakub nie jest cierpliwym człowiekiem. Jego <strong>Furia</strong> kumuluje się podczas innych faz gry (np. gdy wchłania zestawy w fazie przygotowania lub gdy hersztowie kablują na innych hersztów). Szczegółowe zasady ataku i ruchu Jakuba wyglądają następująco:
          </p>
          <ul>
            <li>
              <strong>Czystka w obecnym sektorze:</strong> Przed jakimkolwiek ruchem Jakub najpierw eliminuje pionki w regionie, w którym aktualnie stoi. 
              Atakuje tylko te bandy, na które ma <strong>Furię &gt; 0</strong>. Każda zgładzona jednostka zmniejsza jego Furię na daną bandę o <strong>1</strong> (a jej Herszt traci 1 punkt), a sam zabity pionek wraca do puli posiłków tej bandy, co umożliwia i ułatwia wystawianie zestawów w kolejnych rundach. Czystka trwa dopóki są cele i Furia.
            </li>
            <li>
              <strong>Poszukiwanie celu i ruch:</strong> Jeśli po czystce Jakub wciąż posiada Furię, a na jego polu nie ma już pionków nacji, na które jest zły, rozpoczyna ruch:
              <ol style={{ marginTop: '5px', marginLeft: '20px' }}>
                <li>Wybiera jako cel bandę, na którą ma <strong>najwyższy aktualny poziom Furii</strong> (w przypadku remisu decyduje Hierarchia Band).</li>
                <li>Skanuje regiony w swoim zasięgu ruchu (który wynosi domyślnie 1 + 1 za każdą bandę, na którą ma furię &gt; 9) w poszukiwaniu pionków tej bandy.</li>
                <li>
                  <strong>Rozstrzyganie remisów przy wyborze regionu docelowego:</strong>
                  <ul style={{ marginTop: '5px', listStyleType: 'circle', marginLeft: '20px' }}>
                    <li>Wybiera region w zasięgu z <strong>największą liczbą pionków docelowej bandy</strong>.</li>
                    <li>Przy remisie wybiera ten z <strong>największą łączną liczbą wszystkich pionków</strong> (dowolnych band).</li>
                    <li>Jeśli remis nadal występuje, decyduje <strong>Hierarchia Band</strong> (wybierany jest ten z silniejszą bandą w hierarchii).</li>
                  </ul>
                </li>
              </ol>
              Przed każdym ruchem na nowo wyliczany jest aktualny zasięg Jakuba. Po przemieszczeniu się, Jakub wykonuje ponowną czystkę w nowym regionie.
            </li>
          </ul>
          
          <div className="mechanic-box" style={{ background: '#fcf3cf', borderColor: '#f1c40f', marginTop: '15px' }}>
            <h4>Punkty Świadka Jakuba</h4>
            <p>
              Przyznawane są za odwagę pionkom, które przetrwały bliskie spotkanie z Jakubem. Tuż przed tym, jak Jakub opuści swój dotychczasowy sektor (rozpoczynając ruch do innego regionu), sprawdzane jest obecność pionków graczy.
            </p>
            <p>
              Jeżeli w opuszczanym sektorze znajdują się pionki bandy, na którą <strong>Furia Jakuba wynosi dokładnie 0</strong>, Herszt tej bandy otrzymuje <strong>2 punkty bonusowe</strong> za każdy taki ocalały pionek.
              Punkty te są przyznawane także tym pionkom, które zostaną w regionie Jakuba po tym, jak furia na wszystkie bandy spadnie do 0.
            </p>
          </div>

          <div className="example-screenshots-container" style={{ marginTop: '30px', textAlign: 'center' }}>
            <h5 style={{ fontSize: '1.2em', marginBottom: '20px' }}>Przykład Fazy Jakuba:</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '35px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>1. Faza początkowa:</strong>
                <img src={jakubPhasePart1Img} alt="Jakub Phase Example Part 1" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Faza Jakuba zaczyna się od zabicia Bardaka na polu z Jakubem. Furia Jakuba na Bardaki spada o 1.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>2. Wybór celu i ruch:</strong>
                <img src={jakubPhasePart2Img} alt="Jakub Phase Example Part 2" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Jakub najbardziej pała furią do Bardaków, więc szuka regionu z największą ilością Bardaków w jego zasięgu. Ponieważ żadna z nacji nie ma furii &gt; 9, jego zasięg to 1, więc przeskakuje do regionu w prawo.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>3. Kontynuacja czystki:</strong>
                <img src={jakubPhasePart3Img} alt="Jakub Phase Example Part 3" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Jakub zabił wszystkie pionki w regionie i została mu jeszcze furia.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>4. Rozstrzygnięcie remisu i kolejny ruch:</strong>
                <img src={jakubPhasePart4Img} alt="Jakub Phase Example Part 4" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Ponieważ ma tyle samo furii na Duchy i Bardaki, remis rozstrzyga Hierarchia Band: Wampiry -&gt; Wilkołaki -&gt; Duchy -&gt; Bardaki. Szuka więc w sąsiedztwie regionu z największą ilością Duchów i będzie to region prosto w górę.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '480px' }}>
                <strong style={{ fontSize: '1.05em' }}>5. Zakończenie fazy i Punkty Świadka Jakuba:</strong>
                <img src={jakubPhasePart5Img} alt="Jakub Phase Example Part 5" className="rule-screenshot" style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }} />
                <p style={{ margin: '5px 0 0 0', fontSize: '0.95em', color: '#555', textAlign: 'center', lineHeight: '1.4' }}>
                  Jakub zabił 2 Duchy i Bardaka. Jego obecna furia jest skierowana na Bardaki, ale ponieważ nie ma w zasięgu żadnego Bardaka, szuka kolejnej bandy (Duchów), jednak ich również nie ma. Jego faza furii się kończy. Ponieważ po wygaśnięciu furii na polu z Jakubem pozostał Wilkołak, gracz kontrolujący tę bandę otrzymuje Punkty Świadka Jakuba w wysokości 2 pkt za każdego członka bandy.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rule-section">
          <h2>Koniec Gry i Punktacja Końcowa</h2>
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
            <p>W przypadku jakichkolwiek remisów na koniec gry, zwycięzcą zostaje gracz posiadający generała stojącego najwyżej w <strong>Hierarchii Band</strong>.</p>
          </div>
        </section>
      </div>

      <footer className="rulebook-footer">
        © 2026 Wędrowycz-Gemini Project - Professional Rulebook v1.15.0 | Jakub approves.
      </footer>
    </div>
  );
};

export default GameRulesPage;
