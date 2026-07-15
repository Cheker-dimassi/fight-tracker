// Types for the "gold" UFC dataset (Kaggle: ufc_gold_dataset_final.csv + ufc_fighters_final.csv)
// Replaces the old, mostly-empty ufc_fight_details/ufc_fight_results/ufc_fighter_details CSVs.

// One row per historical fight, 1994 - 2026. No event-name column, only Event_Date,
// so linking a fight to an event in ufc_events.csv must be done by date, not by name.
export interface UfcFightRecord {
  Fight_URL: string;
  Fighter_1: string;
  Fighter_2: string;
  Winner: string; // fighter name, or "Draw"/"NC"-like value
  Weight_Class: string;
  Method: string;
  End_Round: string;
  End_Time: string;
  Total_Fight_Time_Sec: string;
  Time_Format: string;
  F1_KD: string;
  F2_KD: string;
  F1_Sig_Landed: string;
  F1_Sig_Att: string;
  F2_Sig_Landed: string;
  F2_Sig_Att: string;
  F1_TD_Landed: string;
  F2_TD_Landed: string;
  F1_TD_Att: string;
  F2_TD_Att: string;
  F1_Sub_Att: string;
  F2_Sub_Att: string;
  F1_Ctrl_Sec: string;
  F2_Ctrl_Sec: string;
  F1_Head: string;
  F2_Head: string;
  F1_Body: string;
  F2_Body: string;
  F1_Leg: string;
  F2_Leg: string;
  F1_Distance: string;
  F2_Distance: string;
  F1_Clinch: string;
  F2_Clinch: string;
  F1_Ground: string;
  F2_Ground: string;
  Event_Date: string; // "YYYY-MM-DD"
}

// One row per fighter's career profile/biometrics.
export interface UfcFighterRecord {
  Fighter_Name: string;
  Height: string; // e.g. 5' 11" (may be blank)
  Weight: string; // e.g. 155 lbs.
  Reach: string; // may be blank
  Stance: string; // may be blank
  DOB: string; // "YYYY-MM-DD" (may be blank for old/obscure fighters)
  Wins: string;
  Losses: string;
  Draws: string;
  SLpM: string; // significant strikes landed per minute
  Str_Acc: string; // e.g. "38%"
  SApM: string; // significant strikes absorbed per minute
  Str_Def: string; // e.g. "57%"
  TD_Avg: string; // takedowns landed per 15 min
  TD_Acc: string; // e.g. "0%"
  TD_Def: string; // e.g. "77%"
  Sub_Avg: string; // submission attempts per 15 min
  Fighter_URL: string;
}

// Derived, UI-friendly shapes built from the raw rows above.

export interface FightTimelineEntry {
  date: string; // display label, e.g. "MAR 2026"
  isoDate: string; // "YYYY-MM-DD" for sorting
  event: string; // best-effort label (bout title / weight class); real event names aren't in this dataset
  opponent: string;
  result: "WIN" | "LOSS" | "DRAW" | "NC";
  method: string;
  round: number;
  time: string;
}

export interface RealFighterStats {
  striking: number;
  grappling: number;
  stamina: number;
  chin: number;
  heart: number;
  fightIQ: number;
}
