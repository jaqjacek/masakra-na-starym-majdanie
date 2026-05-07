import React from 'react';
import '../../assets/css/rules.css';
import { PAWN_TYPES } from '../../constants/pawnTypes';

const GameRulesPage = () => {
  return (
    <div className="rulebook-wrapper">
      <header className="rulebook-header">
        <button 
          className="no-print" 
          onClick={() => window.history.back()}
          style={{ float: 'left', background: '#2c3e50', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
        >
          ← Back
        </button>
        <button 
          className="no-print" 
          onClick={() => window.print()}
          style={{ float: 'right', background: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}
        >
          Export to PDF
        </button>
        <h1>Ostatni <s>Nocny Zajazd</s> <span style={{ color: '#c0392b', textTransform: 'uppercase', fontWeight: '900', fontStyle: 'italic' }}>Masakra</span> na Starym Majdanie</h1>
        <p>Interaktywny Staropolski Symulator Wybijania Bestii</p>
      </header>

      <div className="rulebook-columns">
        <section className="rule-section">
          <h2>1. Fabuła: Ostatni Zajazd na Stary Majdan</h2>
          <p className="flavor-text">
            "Po latach klęsk, siły ciemności zawarły sojusz w ruinach byłego PGR-u. Jednak aura ich zła obudziła Jakuba w bardzo wrednym humorze..."
          </p>
          <p>
            Generałowie Wampirów, Wilkołaków, Duchów i Bardaków otoczyli Stary Majdan, ale stracili atut zaskoczenia. 
            Teraz, oszołomieni oparami świeżego zacieru, muszą walczyć o honor i Punkty Chwały, zanim nadejdzie świt.
          </p>
          <p>
            W każdej godzinie (rundzie) Twoje mentalne sterowanie może przejąć kontrolę nad inną rasą. 
            Twoim celem jest przetrwanie i takie rozstawienie wojsk, by zadowolić kaprysy Jakuba lub uniknąć jego topora.
          </p>
        </section>

        <section className="rule-section">
          <h2>2. Components</h2>
          <p>The following pieces are used during the game:</p>
          <div className="component-grid">
            {PAWN_TYPES.map(p => (
              <div key={p.id} className="component-item">
                <div className={`component-icon ${p.id}`}></div>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
          <p><strong>Jakub:</strong> A unique entity that moves automatically and "cleans" the board.</p>
        </section>

        <section className="rule-section">
          <h2>3. Game Phases</h2>
          <p>A standard game consists of 10 rounds, each divided into four distinct phases:</p>
          <ul>
            <li><strong>Setup:</strong> The board is initialized and players draw their "Sets" of pawns.</li>
            <li><strong>General Phase:</strong> Players choose which race they will represent this round.</li>
            <li><strong>Player Phase:</strong> The core of the game. Players place their sets or pass.</li>
            <li><strong>Jakub Phase:</strong> Jakub executes his rampage based on his current Anger and Range.</li>
          </ul>
        </section>

        <section className="rule-section">
          <div className="example-box">
            <h3>Example: Placing a Set</h3>
            <p>
              When a player places a <strong>Vampire Set</strong> near Jakub, they gain points immediately. 
              However, if they are too close, Jakub might kill those vampires during his rampage!
            </p>
            <p><em>Strategy: Balance risk and reward.</em></p>
          </div>
        </section>

        <section className="rule-section">
          <h2>4. Winning</h2>
          <p>
            At the end of round 10, a final scoring occurs based on race-specific objectives. 
            The player with the highest total score is declared the winner.
          </p>
        </section>
      </div>

      <footer className="rulebook-footer" style={{ marginTop: '50px', textAlign: 'center', fontSize: '0.8rem', opacity: 0.5 }}>
        © 2026 Wędrowycz-Gemini Project - Professional Rulebook v1.0
      </footer>
    </div>
  );
};

export default GameRulesPage;
