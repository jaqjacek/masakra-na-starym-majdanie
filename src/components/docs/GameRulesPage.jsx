import React from 'react';
import '../../assets/css/rules.css';
import { useTranslation } from '../../hooks/useTranslation';

import html2pdf from 'html2pdf.js';
import packageJson from '../../../package.json';

import coverImg from '../../assets/img/Cover_01_1k.jpg';
import titleImgPl from '../../assets/img/Title_1k.jpg';
import titleImgEn from '../../assets/img/Title_1k_en.jpg';

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
import eventExampleImgEn from '../../assets/img/event_popup.png';
import eventExampleImgPl from '../../assets/img/event_popup_pl.png';
import eventExampleImg2En from '../../assets/img/event_popup_2.png';
import eventExampleImg2Pl from '../../assets/img/event_popup_2_pl.png';

import boardEmptyImg from '../../assets/img/board_empty.png';

import jakubPanelImgEn from '../../assets/img/jakub_panel.png';
import jakubPanelImgPl from '../../assets/img/jakub_panel_pl.png';

import pawnsTotalPanelImg from '../../assets/img/pawns_total_panel.png';
import setPlayer1Img from '../../assets/img/set_player_1.png';
import setPlayer2Img from '../../assets/img/set_player_2.png';
import setPlayer3Img from '../../assets/img/set_player_3.png';
import boardDistanceExampleImg from '../../assets/img/board_distance_example.png';

import jakubPhasePart1ImgEn from '../../assets/img/jakub_phase_example_1_part_1.png';
import jakubPhasePart1ImgPl from '../../assets/img/jakub_phase_example_1_part_1_pl.png';

import jakubPhasePart2ImgEn from '../../assets/img/jakub_phase_example_1_part_2.png';
import jakubPhasePart2ImgPl from '../../assets/img/jakub_phase_example_1_part_2_pl.png';

import jakubPhasePart3ImgEn from '../../assets/img/jakub_phase_example_1_part_3.png';
import jakubPhasePart3ImgPl from '../../assets/img/jakub_phase_example_1_part_3_pl.png';

import jakubPhasePart4ImgEn from '../../assets/img/jakub_phase_example_1_part_4.png';
import jakubPhasePart4ImgPl from '../../assets/img/jakub_phase_example_1_part_4_pl.png';

import jakubPhasePart5ImgEn from '../../assets/img/jakub_phase_example_1_part_5.png';
import jakubPhasePart5ImgPl from '../../assets/img/jakub_phase_example_1_part_5_pl.png';

import scoreExampleVMinus1Img from '../../assets/img/socre_example_v-1_g2_b2.png';
import scoreExampleV8Img from '../../assets/img/socre_example_v8_b0.png';
import scoreExampleW1Img from '../../assets/img/socre_example_w1_b2.png';
import scoreExampleW3Img from '../../assets/img/socre_example_w3.png';
import scoreExampleW3B2Img from '../../assets/img/socre_example_w3_b2.png';
import scoreExampleW4G2Img from '../../assets/img/socre_example_w4_g2.png';

const GameRulesPage = () => {
  const { t, lang } = useTranslation();

  const getLocalizedImage = (defaultEnImg, plOverrideImg) => {
    return lang === 'pl' ? plOverrideImg : defaultEnImg;
  };

  const contentRef = React.useRef(null);

  const handlePrint = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}_${pad(now.getMinutes())}`;
    const filename = `masakra_v${packageJson.version}_${dateStr}.pdf`;
    
    const element = contentRef.current;
    
    // Temporarily hide .no-print elements since html2pdf captures the screen state
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach(el => {
      el.dataset.originalDisplay = el.style.display;
      el.style.display = 'none';
    });

    const opt = {
      margin:       15,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      // Restore .no-print elements
      noPrintElements.forEach(el => {
        el.style.display = el.dataset.originalDisplay || '';
      });
    });
  };

  return (
    <div className="rulebook-wrapper" ref={contentRef}>
      <div className="rulebook-cover-container">
        <img src={coverImg} alt="Game Cover" className="rulebook-cover-bg" />
      </div>

      <header className="rulebook-header">
        <button 
          className="no-print" 
          onClick={() => window.history.back()}
          style={{ float: 'left', background: '#2c3e50', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
        >
          {t('rules_back')}
        </button>
        <button 
          className="no-print" 
          onClick={handlePrint}
          style={{ float: 'right', background: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
        >
          {t('rules_pdf')}
        </button>
        
        <div className="rulebook-title-header-container">
          <img src={getLocalizedImage(titleImgEn, titleImgPl)} alt="MASAKRA NA STARYM MAJDANIE" className="rulebook-title-img" />
        </div>
        <p>{t('rules_edition')}</p>
      </header>

      <div className="rulebook-full-width">
        <section className="rule-section">
          <h2>{t('rules_story_title')}</h2>
          <p className="flavor-text">
            {t('rules_story_flavor')}
          </p>
          <p>
            {t('rules_story_para1')}
          </p>
          <p>
            {t('rules_story_para2')}
          </p>
        </section>

        <section className="rule-section">
          <h2>{t('rules_drama_title')}</h2>
          <div className="generals-grid">
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={vampirePortrait} alt="Vampire General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>{t('rules_drama_vampire_name')}</strong>
                <p>{t('rules_drama_vampire_desc')}</p>
              </div>
            </div>
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={werewolfPortrait} alt="Werewolf General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>{t('rules_drama_werewolf_name')}</strong>
                <p>{t('rules_drama_werewolf_desc')}</p>
              </div>
            </div>
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={ghostPortrait} alt="Ghost General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>{t('rules_drama_ghost_name')}</strong>
                <p>{t('rules_drama_ghost_desc')}</p>
              </div>
            </div>
            <div className="general-card">
              <div className="general-portrait-container">
                <img src={bardakPortrait} alt="Bardak General" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>{t('rules_drama_bardak_name')}</strong>
                <p>{t('rules_drama_bardak_desc')}</p>
              </div>
            </div>
            <div className="general-card special-jakub">
              <div className="general-portrait-container">
                <img src={jakubPortrait} alt="Jakub Wędrowycz" className="general-portrait-img" />
              </div>
              <div className="general-info">
                <strong>{t('rules_drama_jakub_name')}</strong>
                <p>{t('rules_drama_jakub_desc')}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="rulebook-full-width">
        <section className="rule-section">
          <h2>{t('rules_elements_title')}</h2>
          <ul>
            <li>
              <strong>{t('rules_elements_board').split(':')[0]}:</strong>{t('rules_elements_board').split(':')[1]}
              <div className="element-example">
                <img src={boardEmptyImg} alt="Plansza" className="rule-screenshot" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            </li>
            <li>
              <strong>{t('rules_elements_bands').split(':')[0]}:</strong>{t('rules_elements_bands').split(':')[1]}
              <div className="element-example" style={{ marginTop: '10px' }}>
                <div className="pawn-showcase">
                  <div className="pawn-showcase-item">
                    <img src={vampireIcon} alt="Vampire Pawn" />
                    <span>{t('vampire')}</span>
                  </div>
                  <div className="pawn-showcase-item">
                    <img src={werewolfIcon} alt="Werewolf Pawn" />
                    <span>{t('werewolf')}</span>
                  </div>
                  <div className="pawn-showcase-item">
                    <img src={ghostIcon} alt="Ghost Pawn" />
                    <span>{t('ghost')}</span>
                  </div>
                  <div className="pawn-showcase-item">
                    <img src={bardakIcon} alt="Bardak Pawn" />
                    <span>{t('bardak')}</span>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <strong>{t('rules_elements_sets').split(':')[0]}:</strong>{t('rules_elements_sets').split(':')[1]}
              <div className="element-example" style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                <img src={setPlayer1Img} alt="Zestaw 1" className="rule-screenshot" style={{ maxWidth: '30%', height: 'auto' }} />
                <img src={setPlayer2Img} alt="Zestaw 2" className="rule-screenshot" style={{ maxWidth: '30%', height: 'auto' }} />
                <img src={setPlayer3Img} alt="Zestaw 3" className="rule-screenshot" style={{ maxWidth: '30%', height: 'auto' }} />
              </div>
            </li>
            <li>
              <strong>{t('rules_elements_jakub').split(':')[0]}:</strong>{t('rules_elements_jakub').split(':')[1]}
              <div className="element-example" style={{ textAlign: 'center', marginTop: '10px' }}>
                <img src={jakubIcon} alt="Ikona Jakuba" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              </div>
            </li>
            <li>
              <strong>{t('rules_elements_panel_jakub').split(':')[0]}:</strong>{t('rules_elements_panel_jakub').split(':')[1]}
              <div className="element-example" style={{ textAlign: 'center', marginTop: '10px' }}>
                <img src={getLocalizedImage(jakubPanelImgEn, jakubPanelImgPl)} alt="Panel Jakuba" className="rule-screenshot" style={{ maxWidth: '280px', height: 'auto' }} />
              </div>
            </li>
            <li>
              <strong>{t('rules_elements_panel_reinforcements').split(':')[0]}:</strong>{t('rules_elements_panel_reinforcements').split(':')[1]}
              <div className="element-example" style={{ textAlign: 'center', marginTop: '10px' }}>
                <img src={pawnsTotalPanelImg} alt="Panel posiłków Band" className="rule-screenshot" style={{ maxWidth: '280px', height: 'auto' }} />
              </div>
            </li>
            <li>
              <strong>{t('rules_elements_events').split(':')[0]}:</strong>{t('rules_elements_events').split(':')[1]}
              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={getLocalizedImage(eventExampleImgEn, eventExampleImgPl)} alt="Event Example 1" className="rule-screenshot" style={{ maxWidth: '170px', height: 'auto' }} />
                  <p className="caption">{t('rules_elements_fig2')}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={getLocalizedImage(eventExampleImg2En, eventExampleImg2Pl)} alt="Event Example 2" className="rule-screenshot" style={{ maxWidth: '170px', height: 'auto' }} />
                  <p className="caption">{t('rules_elements_fig3')}</p>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <section className="rule-section">
          <h2>{t('rules_flow_title')}</h2>

          <h3>{t('rules_flow_concepts')}</h3>

          <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22', marginBottom: '15px' }}>
            <h4>{t('rules_flow_geometry_title')}</h4>
            <ul>
              <li><strong>{t('rules_flow_geometry_neighbor').split(':')[0]}:</strong>{t('rules_flow_geometry_neighbor').split(':')[1]}</li>
              <li><strong>{t('rules_flow_geometry_dist').split(':')[0]}:</strong>{t('rules_flow_geometry_dist').split(':')[1]}</li>
              <li><strong>{t('rules_flow_geometry_jakub_dist').split(':')[0]}:</strong>{t('rules_flow_geometry_jakub_dist').split(':')[1]}</li>
            </ul>
            <div className="element-example" style={{ marginTop: '20px', textAlign: 'center' }}>
              <img src={boardDistanceExampleImg} alt="Przykłady odległości" className="rule-screenshot" style={{ maxWidth: '100%', height: 'auto' }} />
              <p className="caption">{t('rules_flow_geometry_caption')}</p>
            </div>
          </div>

          <div className="mechanic-box" style={{ background: '#fcf3cf', borderColor: '#f1c40f', marginBottom: '15px' }}>
            <h4>{t('rules_flow_hierarchy_title')}</h4>
            <p>{t('rules_flow_hierarchy_desc')}</p>
            <div className="pawn-showcase compact" style={{ justifyContent: 'center', marginTop: '10px' }}>
              <div className="pawn-showcase-item">
                <img src={vampireIcon} alt="V" />
                <span>{t('vampire')} (V)</span>
              </div>
              <div style={{ fontSize: '1.5em', alignSelf: 'center', color: '#7f8c8d' }}>➔</div>
              <div className="pawn-showcase-item">
                <img src={werewolfIcon} alt="W" />
                <span>{t('werewolf')} (W)</span>
              </div>
              <div style={{ fontSize: '1.5em', alignSelf: 'center', color: '#7f8c8d' }}>➔</div>
              <div className="pawn-showcase-item">
                <img src={ghostIcon} alt="G" />
                <span>{t('ghost')} (G)</span>
              </div>
              <div style={{ fontSize: '1.5em', alignSelf: 'center', color: '#7f8c8d' }}>➔</div>
              <div className="pawn-showcase-item">
                <img src={bardakIcon} alt="B" />
                <span>{t('bardak')} (B)</span>
              </div>
            </div>
          </div>

          <div className="mechanic-box" style={{ background: '#ebf5fb', borderColor: '#3498db', marginBottom: '15px' }}>
            <h4>{t('rules_flow_tie_title')}</h4>
            <p>{t('rules_flow_tie_desc')}</p>
          </div>

          <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22', marginBottom: '15px' }}>
            <h4>{t('rules_flow_fury_title')}</h4>
            <p>{t('rules_flow_fury_desc')}</p>
          </div>

          <div className="mechanic-box" style={{ background: '#fcf3cf', borderColor: '#f1c40f', marginBottom: '15px' }}>
            <h4>{t('rules_flow_range_title')}</h4>
            <p>{t('rules_flow_range_desc')}</p>
          </div>

          <h2>{t('rules_phases_title')}</h2>
          <p>{t('rules_flow_intro')}</p>
          <ol>
            <li>
              <strong>{t('rules_flow_p1_title')}</strong>
              <p>{t('rules_flow_p1_desc')}</p>
            </li>
            <li>
              <strong>{t('rules_flow_p2_title')}</strong>
              <p>{t('rules_flow_p2_desc')}</p>
            </li>
            <li>
              <strong>{t('rules_flow_p3_title')}</strong>
              <p>{t('rules_flow_p3_desc')}</p>
            </li>
            <li>
              <strong>{t('rules_flow_p4_title')}</strong>
              <p>{t('rules_flow_p4_desc')}</p>
            </li>
            <li>
              <strong>{t('rules_flow_p5_title')}</strong>
              <p>{t('rules_flow_p5_desc')}</p>
            </li>
          </ol>
        </section>
      </div>

      <div className="rulebook-full-width">
        <section className="rule-section">
          <h2>{t('rules_scoring_title')}</h2>
          <p>{t('rules_scoring_intro')}</p>
          
          <div className="scoring-rules-grid">
            <div className="scoring-rule-card">
              <div className="rule-card-body">
                <strong>{t('rules_scoring_vampire_title')}</strong>
                <p>{t('rules_scoring_vampire_desc')}</p>
              </div>
            </div>

            <div className="scoring-rule-card">
              <div className="rule-card-body">
                <strong>{t('rules_scoring_werewolf_title')}</strong>
                <p>{t('rules_scoring_werewolf_desc')}</p>
              </div>
            </div>

            <div className="scoring-rule-card">
              <div className="rule-card-body">
                <strong>{t('rules_scoring_ghost_title')}</strong>
                <p>{t('rules_scoring_ghost_desc')}</p>
              </div>
            </div>

            <div className="scoring-rule-card">
              <div className="rule-card-body">
                <strong>{t('rules_scoring_bardak_title')}</strong>
                <p>{t('rules_scoring_bardak_desc')}</p>
              </div>
            </div>
          </div>

          <h3 style={{ marginTop: '30px' }}>{t('rules_scoring_example_title')}</h3>
          
          <div className="carousel-container-rules">
            <div className="score-examples-grid">
              <div className="example-item">
                <div className="example-item-img-container">
                  <img src={scoreExampleV8Img} alt="V8 Example" />
                </div>
                <div className="example-desc">
                  <strong>1.</strong> {t('rules_scoring_ex1')}
                </div>
              </div>

              <div className="example-item">
                <div className="example-item-img-container">
                  <img src={scoreExampleVMinus1Img} alt="V-1 Example" />
                </div>
                <div className="example-desc">
                  <strong>2.</strong> {t('rules_scoring_ex2')}
                </div>
              </div>

              <div className="example-item">
                <div className="example-item-img-container">
                  <img src={scoreExampleW1Img} alt="W1 Example" />
                </div>
                <div className="example-desc">
                  <strong>3.</strong> {t('rules_scoring_ex3')}
                </div>
              </div>

              <div className="example-item">
                <div className="example-item-img-container">
                  <img src={scoreExampleW3Img} alt="W3 Example" />
                </div>
                <div className="example-desc">
                  <strong>4.</strong> {t('rules_scoring_ex4')}
                </div>
              </div>

              <div className="example-item">
                <div className="example-item-img-container">
                  <img src={scoreExampleW3B2Img} alt="W3B2 Example" />
                </div>
                <div className="example-desc">
                  <strong>5.</strong> {t('rules_scoring_ex5')}
                </div>
              </div>

              <div className="example-item">
                <div className="example-item-img-container">
                  <img src={scoreExampleW4G2Img} alt="W4G2 Example" />
                </div>
                <div className="example-desc">
                  <strong>6.</strong> {t('rules_scoring_ex6')}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rule-section">
          <h2>{t('rules_jakub_title')}</h2>
          <ol>
            <li>
              <strong>{t('rules_jakub_p1_title')}</strong>
              <p>{t('rules_jakub_p1_desc')}</p>
            </li>
            <li>
              <strong>{t('rules_jakub_p2_title')}</strong>
              <p>{t('rules_jakub_p2_desc')}</p>
              
              <div className="mechanic-box" style={{ background: '#fdf2e9', borderColor: '#e67e22', margin: '15px 0' }}>
                <h5>{t('rules_jakub_magnetism_title')}</h5>
                <p>{t('rules_jakub_magnetism_desc')}</p>
              </div>

              <div className="mechanic-box" style={{ background: '#ebf5fb', borderColor: '#3498db', margin: '15px 0' }}>
                <h5>{t('rules_jakub_witness_title')}</h5>
                <p>{t('rules_jakub_witness_desc')}</p>
              </div>
            </li>
            <li>
              <strong>{t('rules_jakub_p3_title')}</strong>
              <div className="mechanic-box" style={{ background: '#f4ecf7', borderColor: '#8e44ad', margin: '15px 0' }}>
                <h5>{t('rules_jakub_mercy_title')}</h5>
                <p style={{ margin: 0 }}>{t('rules_jakub_p3_desc')}</p>
              </div>
            </li>
          </ol>

          <h3 style={{ marginTop: '20px' }}>{t('rules_jakub_example_title')}</h3>
          
          <div className="carousel-container-rules">
            <div className="jakub-phase-steps-grid">
              <div className="jakub-step-item">
                <div className="jakub-step-img-container">
                  <img src={getLocalizedImage(jakubPhasePart1ImgEn, jakubPhasePart1ImgPl)} alt="Jakub Phase Step 1" />
                </div>
                <div className="jakub-step-desc">
                  <strong>1.</strong> {t('rules_jakub_ex1')}
                </div>
              </div>

              <div className="jakub-step-item">
                <div className="jakub-step-img-container">
                  <img src={getLocalizedImage(jakubPhasePart2ImgEn, jakubPhasePart2ImgPl)} alt="Jakub Phase Step 2" />
                </div>
                <div className="jakub-step-desc">
                  <strong>2.</strong> {t('rules_jakub_ex2')}
                </div>
              </div>

              <div className="jakub-step-item">
                <div className="jakub-step-img-container">
                  <img src={getLocalizedImage(jakubPhasePart3ImgEn, jakubPhasePart3ImgPl)} alt="Jakub Phase Step 3" />
                </div>
                <div className="jakub-step-desc">
                  <strong>3.</strong> {t('rules_jakub_ex3')}
                </div>
              </div>

              <div className="jakub-step-item">
                <div className="jakub-step-img-container">
                  <img src={getLocalizedImage(jakubPhasePart4ImgEn, jakubPhasePart4ImgPl)} alt="Jakub Phase Step 4" />
                </div>
                <div className="jakub-step-desc">
                  <strong>4.</strong> {t('rules_jakub_ex4')}
                </div>
              </div>

              <div className="jakub-step-item">
                <div className="jakub-step-img-container">
                  <img src={getLocalizedImage(jakubPhasePart5ImgEn, jakubPhasePart5ImgPl)} alt="Jakub Phase Step 5" />
                </div>
                <div className="jakub-step-desc">
                  <strong>5.</strong> {t('rules_jakub_ex5')}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="rulebook-full-width">
        <section className="rule-section">
          <h2>{t('rules_end_title')}</h2>
          
          <h3>{t('rules_end_bonuses')}</h3>
          <ul>
            <li><strong>{t('rules_end_bonus_vampires').split(':')[0]}:</strong>{t('rules_end_bonus_vampires').split(':')[1]}</li>
            <li><strong>{t('rules_end_bonus_werewolves').split(':')[0]}:</strong>{t('rules_end_bonus_werewolves').split(':')[1]}</li>
            <li><strong>{t('rules_end_bonus_ghosts').split(':')[0]}:</strong>{t('rules_end_bonus_ghosts').split(':')[1]}</li>
            <li><strong>{t('rules_end_bonus_bardaks').split(':')[0]}:</strong>{t('rules_end_bonus_bardaks').split(':')[1]}</li>
          </ul>

          <p style={{ marginTop: '20px', fontStyle: 'italic' }}>{t('rules_end_tie_desc')}</p>
        </section>

        <section className="rule-section faq-section-container">
          <h2>{t('rules_faq_title')}</h2>
          <div className="faq-container">
            <div className="faq-item">
              <div className="faq-question">{t('rules_faq_q1')}</div>
              <div className="faq-answer">{t('rules_faq_a1')}</div>
            </div>
            <div className="faq-item">
              <div className="faq-question">{t('rules_faq_q2')}</div>
              <div className="faq-answer">{t('rules_faq_a2')}</div>
            </div>
            <div className="faq-item">
              <div className="faq-question">{t('rules_faq_q3')}</div>
              <div className="faq-answer">{t('rules_faq_a3')}</div>
            </div>
            <div className="faq-item">
              <div className="faq-question">{t('rules_faq_q4')}</div>
              <div className="faq-answer">{t('rules_faq_a4')}</div>
            </div>
            
            <div className="faq-item">
              <div className="faq-question">{t('rules_faq_q5')}</div>
              <div className="faq-answer">{t('rules_faq_a5')}</div>
            </div>
          </div>
        </section>
      </div>

      <footer className="rulebook-footer">
        <p>{t('rules_footer_note')}</p>
      </footer>
    </div>
  );
};

export default GameRulesPage;
