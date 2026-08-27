import { BOMRawRecord, BuildScheduleRecord, InventoryItem } from '../types/bom';

/**
 * Raw default CSV data provided by user
 */
export const DEFAULT_BOM_CSV_TEXT = `Level 1,Level 2,Level 2 QTY,Level 3,Level 3 QTY
2HJ-071-126,DK519-OEM,1,,
2HJ-071-126,RLKVA-NS,1,,
2HJ-071-126,VA126B-NS,2,,
2HJ-071-126-B,ARKB04,2,,
2HJ-071-126-B,ARKL07,2,,
2HJ-071-126-B,ARKT12,1,,
2HJ-071-126-B,QMVA25,2,,
2HJ-071-151,RX100,1,,
2HJ-071-151,VA126B-NS,2,,
2HJ-071-151-A,RSB04B,2,,
2HJ-071-151-A,RSK01,1,,
2HJ-071-155,ARKB04,2,,
2HJ-071-155,ARKL07,2,,
2HJ-071-155,ARKT12,1,,
2HJ-071-155,QMVA25,2,,
33660005B,SUB0369,4,,
420111000030,ARKB05,2,,
420111000030,ARKL01,2,,
420111000030,ARKT09,1,,
420111001034,ARKB05,2,,
420111001034,ARKL05,1,,
420111001034,ARKL06,1,,
420111001034,ARKT01,1,,
420111001034,QMVA10,1,,
420111001034,QMVA20,1,,
43129,RARBA,2,,
5423886030,SUB0312,1,,
5423886030,SUB0582,1,,
5423886030,SUB0583,2,,
5423886030,SUB0587,1,,
5423886030,SUB0616,1,,
5423886030,SUB0617,1,,
5423886030,SUB0628,1,,
5423886030,SUB0629,1,,
5423886030,SUB0630,1,,
5563886010,SUB0601,1,,
5563886010,SUB0602,1,,
5867633270,100-001-00021,4,,
5867633280,100-001-00021,2,,
5867633290,100-001-00021,2,,
710-RLC-00001,P30-101,1,SUB0631,2
710-RSL-00001,RCP69-BK,1,,
710-RSL-00001,SUB0755,1,,
710-RSL-00001,T7-SLRS,1,RLLB,1
710-RSL-00001,VA126B,2,,
710-RSL-00002,RCP68-BK,1,,
710-RSL-00002,SUB0671,2,,
710-RSL-00002,SUB0755,1,,
710-RSL-00002,T7-SLRS,1,RLLB,1
710-RSL-00002,VA126B,2,,
710-RSL-00003,BC2,2,,
710-RSL-00003,LR470,1,,
710-RSL-00003,LR680,1,,
710-RSL-00003,MS30M,2,RLTAB-12,1
710-RSL-00003,P46-100,1,SUB0581,2
710-RSL-00003,RABK-TOY,1,,
710-RSL-00003,RB1650S,3,,
710-RSL-00003,RLLRPAIR,1,,
710-RSL-00004,710-RQM-00001,1,,
710-RSL-00004,BC3,1,,
710-RSL-00004,LR470,2,,
710-RSL-00004,MS35M,2,RLTAB-12,1
710-RSL-00004,P46-101,1,SUB0631,2
710-RSL-00004,QMHD05,3,,
710-RSL-00004,RB1650S,3,,
710-RSL-00004,RCHT6,1,,
710-RSL-00004,RCP65-BK,1,,
710-RSL-00004,RLLBPAIR,1,,
710-RSL-00004,RLSTHIACE,2,,
710-RSL-00005,710-RQM-00001,1,,
710-RSL-00005,BC3,1,,
710-RSL-00005,LR470,1,,
710-RSL-00005,LR680,1,,
710-RSL-00005,MS35M,2,RLTAB-12,1
710-RSL-00005,P46-101,1,SUB0631,2
710-RSL-00005,QMHD05,3,,
710-RSL-00005,RB1650S,3,,
710-RSL-00005,RCHT6,1,,
710-RSL-00005,RCP65-BK,1,,
710-RSL-00005,RLLBPAIR,1,,
710-RSL-00005,RLSTHIACE,2,,
710-RSL-00006,710-RQM-00001,1,,
710-RSL-00006,LR470,2,,
710-RSL-00006,MS35M,2,RLTAB-12,1
710-RSL-00006,QMHD05,3,,
710-RSL-00006,RB1650S,3,,
710-RSL-00006,RCHT6,1,,
710-RSL-00006,RCP65-BK,1,,
710-RSL-00006,RLLBPAIR,1,,
710-RSL-00006,RLSTHIACE,2,,
710-RSL-00007,710-RQM-00001,1,,
710-RSL-00007,LR470,1,,
710-RSL-00007,LR680,1,,
710-RSL-00007,MS35M,2,RLTAB-12,1
710-RSL-00007,QMHD05,3,,
710-RSL-00007,RB1650S,3,,
710-RSL-00007,RCHT6,1,,
710-RSL-00007,RCP65-BK,1,,
710-RSL-00007,RLLBPAIR,1,,
710-RSL-00007,RLSTHIACE,2,,
710-RSL-00008,ARB-AERO,2,,
710-RSL-00008,DK294R,1,,
710-RSL-00008,LR470,1,,
710-RSL-00008,MS26M,1,RLTAB-12,1
710-RSL-00008,RLKS5,1,,
710-RSL-00008,RLKVAH,1,,
710-RSL-00008,RLLR,1,,
710-RSL-00008,SUB0603,1,SUB0631,2
710-RSL-00008,SUB0755,1,,
710-RSL-00008,VA137B,3,,
710-RSL-00009,B096-BP,1,,
710-RSL-00009,LR470,1,,
710-RSL-00009,MS26M,1,RLTAB-12,1
710-RSL-00009,RLKS5,1,,
710-RSL-00009,RLLR,1,,
710-RSL-00009,SUB0603,1,SUB0631,2
710-RSL-00009,SUB0755,1,,
710-RSL-00010,B096-BP,1,,
710-RSL-00010,BC2-TEL,1,,
710-RSL-00010,LR470,1,,
710-RSL-00010,MS26M,1,RLTAB-12,1
710-RSL-00010,RLLR,1,,
710-RSL-00010,SUB0603,1,SUB0631,2
710-RSL-00010,SUB0755,1,,
710-RSL-00010,VACB,2,,
710-SUB-00003,SUB0631,2,,
710-SUB-00008,BC4-H1,1,,
AT2112VA,SK35,1,,
BEC,BCW,2,,
CADDY04,M010C,2,,
CADDY05,M057C,2,,
CGA52APH30,710-SUB-00008,1,BC4-H1,1
CGA52APH30,MS30MOEMEXT,1,LR470,1
CGA52APH30,MS30MOEMEXT,1,RLTAB-12,1
CGA52APH30,MS30MOEMSTEP,1,LR680,1
CGA52APH30,MS30MOEMSTEP,1,RLTAB-12,1
CGA52APH30,P46-101,1,SUB0631,2
CGA52APH73,SUB0820,2,,
CGA52APH73,SUB0821,2,,
CGA52APH75,SUB0820,2,,
CGA52APH75,SUB0821,2,,
CSL26M,RLTAB-12,1,,
CSL26M-ERG,RLTAB-12,1,,
CSL30M,RLTAB-12,1,,
CSL30M-ERG,RLTAB-12,1,,
CSL35M,RLTAB-12,1,,
CSL35M-ERG,RLTAB-12,1,,
CSL40M,RLTAB-12,1,,
CSL40M-ERG,RLTAB-12,1,,
DK285,FMP05,1,,
DK285,FMP07,1,,
DK286,FMP05,1,,
DK286,FMP26,1,,
DK289,FMP05,1,,
DK289,FMP09,1,,
DK290,FMP05,1,,
DK290,FMP21,1,,
DK292,FMP03,1,,
DK292,FMP05,1,,
DK292,FMP07,1,,
DK420,FMP05,1,,
DK420,FMP08,1,,
DK428,FMP05,1,,
DK428,FMP29,1,,
G31251L000AU,SUB0108,1,,
G31251L000AU,SUB0474,1,,
G31251L000AU,SUB0475,1,,
G31251L000AU,SUB0477,4,,
G31251L100AU,SUB0474,1,,
G31251L100AU,SUB0475,1,,
G31251L100AU,SUB0478,4,,
G31251L100AU,SUB0483,1,,
G31251L100AU,SUB0489,1,,
G31261AMT0AU,SUB0272,1,,
G31261L000AU,SUB0476,1,,
G31261L000AU,SUB0477,2,,
G31261L000AU,SUB0480,1,,
G31261L000AU,SUB0482,1,,
G31261L000AU,SUB0485,1,,
G31261L100AU,SUB0476,1,,
G31261L100AU,SUB0478,2,,
G31261L100AU,SUB0484,1,,
G31261L100AU,SUB0490,1,,
G3126C192AU,SUB0067,1,,
G3126SXBCOAU,C586,1,,
G36051L000AU,SK35NIS,1,,
G3A12APH01,SUB0792,1,,
GRA-0A02-045190,SP370,1,,
GRA-0A02-045200,VA-VGS8,1,,
GRA-0A02-045210,M623-BP,1,,
GRA-0A06-045240,RDB165,1,,
GRA-0A16-045300,SP310,1,,
GRA-0A54-001550,43206,1,,
GRA-0B13-045180,SP336,1,,
GRA-0B22-045170,SP363,1,,
GRA-0B25-045130,CA1175,1,,
GU2112,LHS-A1PAIR,1,,
GU2112,RL110S5,3,,
GU2112,SK35,1,,
GU2112,VA-FK1,3,,
H8A12APK00,SUB0710,1,,
H8A12APK00,SUB0711,1,,
H8A12APK00,SUB0712,1,,
H8A12APK00,SUB0713,4,,
H8A12APK00,SUB0714,1,,
ILRRACK,SUB0820,2,,
ILRRACK,SUB0821,2,,
LC2112,RCP17-BK,1,,
LC2112,SK35,1,,
MS26M,RLTAB-12,1,,
MS30M,RLTAB-12,1,,
MS30MOEMEXT,LR470,1,,
MS30MOEMEXT,RLTAB-12,1,,
MS30MOEMSTEP,LR680,1,,
MS30MOEMSTEP,RLTAB-12,1,,
MS35M,RLTAB-12,1,,
MS40M,RLTAB-12,1,,
P275-101,SUB0631,2,,
P30-100,SUB0581,2,,
P30-101,SUB0631,2,,
P46-100,SUB0581,2,,
P46-101,SUB0631,2,,
PZQ30-75010CH,BC3-TEL,1,,
PZQ30-75010CH,SUB0631,2,,
PZQ3000050,SUB0007,1,,
PZQ3000080,SUB0002,1,,
PZQ3000090,SUB0231,1,,
PZQ3012070,SUB0309,4,,
PZQ3012070,SUB0310,1,,
PZQ3012070,SUB0312,1,,
PZQ3012070,SUB0437,1,,
PZQ3012070,SUB0471,1,,
PZQ3012070,SUB0472,1,,
PZQ3012070,SUB0803,1,,
PZQ3012100,SUB0718,1,,
PZQ30121A2,SUB0718,1,,
PZQ3042050,SUB0486,2,,
PZQ3042050,SUB0487,2,,
PZQ3042050,SUB0488,1,,
PZQ3042050LL,SUB0486,1,,
PZQ3048050CP,SUB0205,1,,
PZQ3060070,SUB0027,1,,
PZQ3060071,SUB0028,1,,
PZQ3060130,SUB0217,1,,
PZQ3060130,SUB0228,4,,
PZQ3060130,SUB0232,1,,
PZQ3060130,SUB0233,1,,
PZQ3060130,SUB0236,1,,
PZQ3060140,SUB0219,1,,
PZQ3060140,SUB0228,2,,
PZQ3060140,SUB0234,1,,
PZQ3060140,SUB0237,1,,
PZQ3060150,BK150S11,4,,
PZQ3060150,SUB0027,1,,
PZQ3060160,SUB0216,1,,
PZQ3060160,SUB0229,1,,
PZQ3060160,SUB0230,1,,
PZQ3060160,SUB0231,6,,
PZQ3060160,SUB0232,1,,
PZQ3060160,SUB0233,1,,
PZQ3060160,SUB0234,1,,
PZQ3060165,HK35NIS,1,,
PZQ3060165AT,AT-BAG3,1,,
PZQ3060170,SUB0228,4,,
PZQ3060170,SUB0236,1,,
PZQ3060170,SUB0293,1,,
PZQ3060170,SUB0294,1,,
PZQ3060170,SUB0315,1,,
PZQ3060180,SUB0228,2,,
PZQ3060180,SUB0237,1,,
PZQ3060180,SUB0295,1,,
PZQ3060180,SUB0316,1,,
PZQ3060190,SUB0229,1,,
PZQ3060190,SUB0230,1,,
PZQ3060190,SUB0231,6,,
PZQ3060190,SUB0293,1,,
PZQ3060190,SUB0294,1,,
PZQ3060190,SUB0295,1,,
PZQ3060190,SUB0314,1,,
PZQ3060195,SK24-TOY,1,,
PZQ3060200,SUB0205,4,,
PZQ3060200,SUB0325,1,,
PZQ3060200CB,SUB0008,1,,
PZQ3060200CB,SUB0205,2,,
PZQ3060205,100-001-00063,4,,
PZQ3060205,100-001-00071,1,,
PZQ3060205CB,100-001-00063,2,,
PZQ3060205CP,100-001-00063,2,,
PZQ3060220,SUB0205,4,,
PZQ3060230,HK34-TOY,1,,
PZQ3075060,BC3-TEL,1,,
PZQ3075060,PZQ3075040,1,,
PZQ3075060,RABK-TOY,1,,
PZQ3075060,RLSTHIACE,2,,
PZQ3075060,RLTAB-12,2,,
PZQ3075060,SUB0631,2,,
PZQ3089050,SUB0623,1,,
PZQ5175100,SUB0820,2,,
PZQ5175100,SUB0821,2,,
RTL002,SUB0447,1,,
RTS547,RTS547-FK,1,,
RV0321B,DK294,1,,
RVP24,RCP24-BK,1,,
RVP27,RCP27-BK,1,,
RVP45,RCP45-BK,1,,
RVP50,RCP47-BK,1,,
RVP50,SUB0671,1,,
RVP57,SUB0671,1,,
RVP63,RCP-JB,1,,
RVP66,RCP32-BK,1,,
RVP72,RCP66-BK,1,,
RVP77,RCP66-BK,1,,
RVP78,RCP66-BK,1,,
RVP79,RCP66-BK,1,,
RVP80,RCP66-BK,1,,
RVP81,RCP69-BK,1,,
RVP83,RCP68-BK,1,,
RVP89,RCP29-BK,1,,
RVP90,RCP70-BK,1,,
RVP92,RCP89-BK,1,,
SG60,CA1263-4,1,,
SPMERCH4,B014-BP,3,,
SPMERCH4,B015-BP,3,,
SPMERCH4,B018-BP,3,,
SPMERCH4,B054-BP,3,,
SPMERCH4,B062-BP,3,,
SPMERCH4,B130-BP,3,,
SPMERCH4,B143-BP,3,,
SPMERCH4,B222-BP,3,,
SPMERCH4,B247-BP,3,,
SPMERCH4,C764-BP,3,,
SPMERCH4,CA1260-BP,3,,
SPMERCH4,CA1397-BP,3,,
SPMERCH4,M623-BP,3,,
SPMERCH4,M982-BP,3,,
SPMERCH4,N002-BP,3,,
SPMERCH4,N003-BP,3,,
SPMERCH4,N013-BP,3,,
SPMERCH4,N024-BP,3,,
SPMERCH4,N025-BP,3,,
SPMERCH4,N028-BP,3,,
SPMERCH4,N057-BP,3,,
SPMERCH4,N068-BP,3,,
SPMERCH4,RK012,3,,
SPMERCH4,RK012-2,3,,
SPMERCH4,RK059,3,,
SPMERCH4,RK059-2,3,,
SPMERCH4,RK062,3,,
SPMERCH4,RK062-2,3,,
SPMERCH4,RK083,3,,
SPMERCH4,RK083-2,3,,
SPMERCH4,RK106,3,,
SPMERCH4,RK106-2,3,,
SPMERCH4,RK118,3,,
SPMERCH4,RK118-2,3,,
SPMERCH4,RK125,3,,
SPMERCH4,RK125-2,3,,
SPMERCH4,SP329,3,,
SPMERCH4,STAND012,1,,
SPMERCH4,VA-VGS8,3,,
SUB0603,SUB0631,2,,
SUB0604,SUB0631,2,,
SUB0751,SUB0750,4,,
SUB0825,M074C8,1,,
SX021,SUB0496,2,,
SX021,SUB0497,2,,
SX022,M072CUT,4,,
T7-CON,BC2-TEL,1,,
T7-CON,P30-101,1,SUB0631,2
T7-CON,SUB0424,1,,
T7-CON275M,BC2,1,,
T7-CON275M,P275-101,1,SUB0631,2
T7-CON275M,VACB,2,,
T7-FK3,RLLR,1,,
T7-SLRS,RLLB,1,,
T8-FK2,BC2,1,,
T8-FK2,SUB0424,1,,
VGA071126BT504,BKTFT5,8,,
VGA071126CDY05,SUB0055,1,,
VGA071126CDY05,SUB0072,1,,
VGA071126CDY05,SUB0098,1,,
VGA071792AMS19,RTC10-FK,1,,
VGA7LAT61LRSFT,710-SUB-00002,1,,
VGA7LAT61LRSFT,710-SUB-00003,1,SUB0631,2
VGA7LAT61LRSFT,MS30MOEMEXT,1,LR470,1
VGA7LAT61LRSFT,MS30MOEMEXT,1,RLTAB-12,1
VGA7LAT61LRSFT,MS30MOEMSTEP,1,LR680,1
VGA7LAT61LRSFT,MS30MOEMSTEP,1,RLTAB-12,1
VGB3Z9955100C,LHS-A1PAIR,1,,
VGB3Z9955100C,RLKS2,1,,
VGB3Z9955100G,LHS2PAIR,1,,
VGB3Z9955100G,RLKS3,1,,
VGB3Z9955106B,RSB04B,2,,
VGB3Z9955106B,RSK01,1,,
VGB3Z9955106D,VA126B,2,,
VGK2Z99550A82A,LHSPAIR,2,,
VGK2Z99550A82A,RLTPFTC,3,,
VGK2Z99550A82B,LHS-A1PAIR,2,,
VGK2Z99550A82B,RLTPFTC,3,,
VGK2Z99550A82B,VA-FK1,3,,
VJB3Z78513A06A,RMFT410A,1,,
VJB3Z9955106GQ,DK294,1,,
VJB3Z9955106GQ,RLKVA,1,,
VJB3Z9955106GQ,VA137B,2,,
VJC1Z9955106B,LHSPAIR,2,,
VJC1Z9955106B,RB1500B,3,,
VJC1Z9955106B,RLTPFTC,3,,
VJC1Z9955106K,BC3,1,,
VJC1Z9955106K,LHSPAIR,2,,
VJC1Z9955106K,MS30MOEMEXT,1,LR470,1
VJC1Z9955106K,MS30MOEMEXT,1,RLTAB-12,1
VJC1Z9955106K,MS30MOEMSTEP,1,LR680,1
VJC1Z9955106K,MS30MOEMSTEP,1,RLTAB-12,1
VJC1Z9955106K,P46-100,1,SUB0581,2
VJC1Z9955106K,RB1500S,3,,
VJC1Z9955106K,RLTPFTC,3,,
VN1VZ9955106Q,VA126B,2,,
VN1VZ9955106R,VA126B,2,,
VN1WZ13121B,43174,1,,
VN1WZ78513A06A,RMFT530A,1,,
VN1WZ9955106B,ARKB04,2,,
VN1WZ9955106B,ARKL06,2,,
VN1WZ9955106B,ARKT12,1,,
VN1WZ9955106B,QMVA25,2,,
VN1WZ9955106C,ARKB04,2,,
VN1WZ9955106C,ARKL06,2,,
VN1WZ9955106C,ARKT13,1,,
VN1WZ9955106C,QMVA25,2,,
VN1WZ9955106D,ARKB06,2,,
VN1WZ9955106D,ARKL06,2,,
VN1WZ9955106D,ARKT14,1,,
VN1WZ9955106D,QMVA05,1,,
VN1WZ9955106D,QMVA15,1,,
VN1WZ9955106E,ARKB06,2,,
VN1WZ9955106E,ARKL06,2,,
VN1WZ9955106E,ARKT15,1,,
VN1WZ9955106E,QMVA05,1,,
VN1WZ9955106E,QMVA15,1,,
VN1WZ9955106F,DK519-OEM,1,,
VN1WZ9955106F,RLKVA,1,,
VN1WZ9955106F,VA126B,2,,
VN1WZ9955106G,DK519F-OEM,1,,
VN1WZ9955106G,RLKVAH,1,,
VN1WZ9955106G,VA126B,1,,
VN1WZ9955106H,RLKVAH,1,,
VN1WZ9955106H,VA126B,1,,
VN1WZ9955106J,RX100,1,,
VN1WZ9955106J,VA126B,2,,
VN1WZ9955106K,DK520F-OEM,1,,
VN1WZ9955106K,RLKVAH,1,,
VN1WZ9955106K,VA126B,1,,
VN1WZ9955106M,DK520-OEM,1,,
VN1WZ9955106M,RLKVA,1,,
VN1WZ9955106M,VA126B,2,,
VP1WZ9955106F,RX100,1,,
VP1WZ9955106F,VA165B,2,,
VP1WZ9955106G,RCP86-BK,1,,
VP1WZ9955106G,VA165B,2,,
Y01-120B,RB1375B,2,,
Y01-120B,RTC16-FK,1,,
Y01-120B,SUB0591,2,,
Y01-120B,SUB0592,1,,
Y01-120B,SUB0594,1,,
Y01-120B-NT,RB1375B,2,,
Y01-120B-NT,SUB0591,2,,
Y01-120B-NT,SUB0592,1,,
Y01-120B-NT,SUB0594,1,,
Y01-120B-NT,T-FK1,1,,
Y01-130B,RB1500B,2,,
Y01-130B,RTC16-FK,1,,
Y01-130B,SUB0591,2,,
Y01-130B,SUB0592,1,,
Y01-130B,SUB0594,1,,
Y01-140B,RB1650B,2,,
Y01-140B,RTC16-FK,1,,
Y01-140B,SUB0591,2,,
Y01-140B,SUB0592,1,,
Y01-140B,SUB0594,1,,
Y01-140B-NT,RB1650B,2,,
Y01-140B-NT,SUB0591,2,,
Y01-140B-NT,SUB0592,1,,
Y01-140B-NT,SUB0594,1,,
Y01-140B-NT,T-FK1,1,,
Y02-480B,RTC16-FK,1,,
Y02-480B,SUB0591,2,,
Y02-480B,SUB0592,1,,
Y02-480B,SUB0593,1,,
Y02-480B,VA137B,2,,
Y02-480B-NT,SUB0591,2,,
Y02-480B-NT,SUB0592,1,,
Y02-480B-NT,SUB0593,1,,
Y02-480B-NT,T-FK1,1,,
Y02-480B-NT,VA137B,2,,
Y02-480B-ST,RTC16-ST-FK,1,,
Y02-480B-ST,SUB0591,2,,
Y02-480B-ST,SUB0592,1,,
Y02-480B-ST,SUB0593,1,,
Y02-480B-ST,VA137B,2,,
Y02-490B,RTC16-FK,1,,
Y02-490B,SUB0591,2,,
Y02-490B,SUB0592,1,,
Y02-490B,SUB0593,1,,
Y02-490B,VA150B,2,,
Y02-490B-NT,SUB0591,2,,
Y02-490B-NT,SUB0592,1,,
Y02-490B-NT,SUB0593,1,,
Y02-490B-NT,T-FK1,1,,
Y02-490B-NT,VA150B,2,,
Y02-490B-ST,RTC16-ST-FK,1,,
Y02-490B-ST,SUB0591,2,,
Y02-490B-ST,SUB0592,1,,
Y02-490B-ST,SUB0593,1,,
Y02-490B-ST,VA150B,2,,
Y02-500B,RTC16-FK,1,,
Y02-500B,SUB0591,2,,
Y02-500B,SUB0592,1,,
Y02-500B,SUB0593,1,,
Y02-500B,VA165B,2,,
Y02-500B-NT,SUB0591,2,,
Y02-500B-NT,SUB0592,1,,
Y02-500B-NT,SUB0593,1,,
Y02-500B-NT,T-FK1,1,,
Y02-500B-NT,VA165B,2,,
Y02-500B-ST,RTC16-ST-FK,1,,
Y02-500B-ST,SUB0591,2,,
Y02-500B-ST,SUB0592,1,,
Y02-500B-ST,SUB0593,1,,
Y02-500B-ST,VA165B,2,,`;

/**
 * Parse CSV text into BOMRawRecord array
 */
function parseBOMCSV(csvText: string): BOMRawRecord[] {
  const lines = csvText.trim().split('\n');
  const records: BOMRawRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    const level1 = (parts[0] || '').trim();
    const level2 = (parts[1] || '').trim();
    const level2Qty = parts[2] && parts[2].trim() !== '' ? Number(parts[2].trim()) : 1;
    const level3 = parts[3] ? parts[3].trim() : '';
    const level3Qty = parts[4] && parts[4].trim() !== '' ? Number(parts[4].trim()) : 0;

    if (level1 || level2) {
      records.push({
        id: `bom-default-${i}`,
        level1,
        level2,
        level2Qty: isNaN(level2Qty) ? 1 : level2Qty,
        level3: level3 || undefined,
        level3Qty: isNaN(level3Qty) ? 0 : level3Qty,
        parent: level1,
        component: level2,
        qty: isNaN(level2Qty) ? 1 : level2Qty,
        unit: 'EA',
      });
    }
  }
  return records;
}

export const SAMPLE_POWER_QUERY_BOM: BOMRawRecord[] = parseBOMCSV(DEFAULT_BOM_CSV_TEXT);

/**
 * Default Build Schedule as provided by user in Image 1
 */
export const SAMPLE_POWER_QUERY_BUILD_SCHEDULE: BuildScheduleRecord[] = [
  { parent: 'RLKVA', buildQty: 192, workOrder: 'WO-RLKVA-01', dueDate: '2026-09-01' },
  { parent: 'SUB0798', buildQty: 300, workOrder: 'WO-SUB0798-01', dueDate: '2026-09-01' },
  { parent: 'RCP58-BK', buildQty: 400, workOrder: 'WO-RCP58-01', dueDate: '2026-09-01' },
  { parent: 'PZQ3060070', buildQty: 20, workOrder: 'WO-PZQ-0070', dueDate: '2026-09-02' },
  { parent: '2HJ-071-126', buildQty: 31, workOrder: 'WO-2HJ-126', dueDate: '2026-09-02' },
  { parent: 'RCH6', buildQty: 192, workOrder: 'WO-RCH6-01', dueDate: '2026-09-02' },
  { parent: 'RLTF', buildQty: 192, workOrder: 'WO-RLTF-01', dueDate: '2026-09-03' },
  { parent: 'N003-BP', buildQty: 500, workOrder: 'WO-N003-01', dueDate: '2026-09-03' },
  { parent: 'BC3-150', buildQty: 220, workOrder: 'WO-BC3-150', dueDate: '2026-09-04' },
  { parent: 'LR1020', buildQty: 1, workOrder: 'WO-LR1020-01', dueDate: '2026-09-04' },
  { parent: 'SX022', buildQty: 80, workOrder: 'WO-SX022-01', dueDate: '2026-09-05' },
  { parent: 'B120010-BP', buildQty: 10, workOrder: 'WO-B120010-01', dueDate: '2026-09-05' },
  { parent: 'DK519', buildQty: 240, workOrder: 'WO-DK519-01', dueDate: '2026-09-06' },
  { parent: 'RTS518', buildQty: 40, workOrder: 'WO-RTS518-01', dueDate: '2026-09-06' },
  { parent: 'RL150S10', buildQty: 240, workOrder: 'WO-RL150S-01', dueDate: '2026-09-07' },
  { parent: 'CXB', buildQty: 40, workOrder: 'WO-CXB-01', dueDate: '2026-09-07' },
  { parent: 'RTS542', buildQty: 63, workOrder: 'WO-RTS542-01', dueDate: '2026-09-08' },
  { parent: 'SP329', buildQty: 50, workOrder: 'WO-SP329-01', dueDate: '2026-09-08' },
  { parent: 'S606', buildQty: 144, workOrder: 'WO-S606-01', dueDate: '2026-09-09' },
  { parent: '5867633290', buildQty: 5, workOrder: 'WO-586763-01', dueDate: '2026-09-09' },
  { parent: 'DK088', buildQty: 5, workOrder: 'WO-DK088-01', dueDate: '2026-09-10' },
  { parent: 'DK137', buildQty: 8, workOrder: 'WO-DK137-01', dueDate: '2026-09-10' },
  { parent: 'DK330R', buildQty: 4, workOrder: 'WO-DK330R-01', dueDate: '2026-09-11' },
  { parent: 'DK520F', buildQty: 6, workOrder: 'WO-DK520F-01', dueDate: '2026-09-11' },
  { parent: 'PZQ306036A', buildQty: 1, workOrder: 'WO-PZQ-36A', dueDate: '2026-09-12' },
  { parent: 'PZQ306036B', buildQty: 1, workOrder: 'WO-PZQ-36B', dueDate: '2026-09-12' },
  { parent: 'RB1120B', buildQty: 17, workOrder: 'WO-RB1120B-01', dueDate: '2026-09-13' },
  { parent: 'RLKS3', buildQty: 38, workOrder: 'WO-RLKS3-01', dueDate: '2026-09-13' },
  { parent: 'RLTFHIF/M', buildQty: 12, workOrder: 'WO-RLTFHIF-01', dueDate: '2026-09-14' },
  { parent: 'RRM16', buildQty: 5, workOrder: 'WO-RRM16-01', dueDate: '2026-09-14' },
  { parent: 'SP320', buildQty: 5, workOrder: 'WO-SP320-01', dueDate: '2026-09-15' },
];

/**
 * Generate intelligent inventory records for all items in the user's BOM
 */
export function generateInventoryFromBOM(bomRecords: BOMRawRecord[]): InventoryItem[] {
  const parts = new Set<string>();
  bomRecords.forEach((b) => {
    if (b.level3) parts.add(b.level3);
    if (b.level2) parts.add(b.level2);
    if (b.component) parts.add(b.component);
  });

  const inventory: InventoryItem[] = [];
  const partDescriptions: Record<string, string> = {
    'DK519-OEM': 'OEM Fitment Mounting Kit',
    'RLKVA-NS': 'Vortex Base Bracket Non-Slotted',
    'VA126B-NS': 'Vortex Aero Bar 1260mm Black NS',
    'SUB0027': 'Subassembly Mounting Pad 27',
    'M072CUT': 'Precision Extrusion Bar M072',
    '100-001-00021': 'M6x16mm Stainless Bolt Set',
    'RLTAB-12': 'Release Tab Fastener Clip 12',
    'SUB0581': 'High Pressure Seal Bushing',
    'SUB0631': 'Internal Locking Core 631',
    'BC4-H1': 'Heavy Duty Bar Clamp H1',
    'LR470': 'Leg Leg Assembly 470mm Left',
    'LR680': 'Leg Leg Assembly 680mm Right',
    'MS30M': 'Master Subassembly 30M Leg',
    'P46-100': 'Pad & Pivot Subassembly 46-100',
    '710-RQM-00001': 'Quick Mount Quick-Release Subassembly',
  };

  parts.forEach((part) => {
    const isSpecial = part === 'DK519-OEM' || part === 'RLKVA-NS' || part === 'VA126B-NS' || part === 'SUB0027';
    inventory.push({
      partNumber: part,
      description: partDescriptions[part] || `Production Component ${part}`,
      onHand: isSpecial ? 500 : Math.floor(Math.random() * 400) + 20,
      safetyStock: 30,
      unitCost: Math.round((Math.random() * 18 + 1.25) * 100) / 100,
      leadTimeDays: Math.floor(Math.random() * 14) + 3,
      unit: 'EA',
    });
  });

  return inventory;
}

export const SAMPLE_INVENTORY: InventoryItem[] = generateInventoryFromBOM(SAMPLE_POWER_QUERY_BOM);

/**
 * Sample 2: Deep 5-Level Hierarchical Drone & Robotics System BOM
 */
export const SAMPLE_MULTI_LEVEL_BOM: BOMRawRecord[] = [
  // Top Level Drone Assembly (DRONE-X400)
  { parent: 'DRONE-X400', component: 'ARM-ASSY-CW', qty: 2, description: 'Clockwise Motor Arm Assembly', unit: 'EA', partType: 'Subassembly' },
  { parent: 'DRONE-X400', component: 'ARM-ASSY-CCW', qty: 2, description: 'Counter-Clockwise Motor Arm Assembly', unit: 'EA', partType: 'Subassembly' },
  { parent: 'DRONE-X400', component: 'CORE-FUSELAGE-MOD', qty: 1, description: 'Core Fuselage & Avionics Bay', unit: 'EA', partType: 'Subassembly' },
  { parent: 'DRONE-X400', component: 'LANDING-GEAR-PAIR', qty: 2, description: 'Carbon Fiber Skid Landing Gear', unit: 'EA', partType: 'Subassembly' },
  { parent: 'DRONE-X400', component: 'BATT-PACK-6S-5000', qty: 1, description: 'LiPo 6S 5000mAh 45C Smart Battery', unit: 'EA', partType: 'Purchased' },

  // Level 2: ARM-ASSY-CW
  { parent: 'ARM-ASSY-CW', component: 'MOTOR-BLDC-2207', qty: 1, description: 'Brushless DC Motor 2207 1800KV', unit: 'EA', partType: 'Purchased' },
  { parent: 'ARM-ASSY-CW', component: 'PROP-CARBON-10X45-CW', qty: 1, description: 'Carbon Propeller 10x4.5 CW', unit: 'EA', partType: 'Purchased' },
  { parent: 'ARM-ASSY-CW', component: 'ESC-40A-SMD', qty: 1, description: 'Electronic Speed Controller 40A DShot', unit: 'EA', partType: 'Subassembly' },
  { parent: 'ARM-ASSY-CW', component: 'CARBON-TUBE-16MM', qty: 1, description: 'Carbon Fiber Tube 16mm x 250mm', unit: 'EA', partType: 'Purchased' },
  { parent: 'ARM-ASSY-CW', component: 'M3-AL-SPACER', qty: 4, description: 'M3x20mm Knurled Aluminum Spacer', unit: 'EA', partType: 'Purchased' },
  { parent: 'ARM-ASSY-CW', component: 'BOLT-M3-12', qty: 8, description: 'M3x12mm Grade 12.9 Steel Bolt', unit: 'EA', partType: 'Purchased' },

  // Level 2: ARM-ASSY-CCW
  { parent: 'ARM-ASSY-CCW', component: 'MOTOR-BLDC-2207', qty: 1, description: 'Brushless DC Motor 2207 1800KV', unit: 'EA', partType: 'Purchased' },
  { parent: 'ARM-ASSY-CCW', component: 'PROP-CARBON-10X45-CCW', qty: 1, description: 'Carbon Propeller 10x4.5 CCW', unit: 'EA', partType: 'Purchased' },
  { parent: 'ARM-ASSY-CCW', component: 'ESC-40A-SMD', qty: 1, description: 'Electronic Speed Controller 40A DShot', unit: 'EA', partType: 'Subassembly' },
  { parent: 'ARM-ASSY-CCW', component: 'CARBON-TUBE-16MM', qty: 1, description: 'Carbon Fiber Tube 16mm x 250mm', unit: 'EA', partType: 'Purchased' },
  { parent: 'ARM-ASSY-CCW', component: 'M3-AL-SPACER', qty: 4, description: 'M3x20mm Knurled Aluminum Spacer', unit: 'EA', partType: 'Purchased' },
  { parent: 'ARM-ASSY-CCW', component: 'BOLT-M3-12', qty: 8, description: 'M3x12mm Grade 12.9 Steel Bolt', unit: 'EA', partType: 'Purchased' },

  // Level 3: ESC-40A-SMD (Subassembly)
  { parent: 'ESC-40A-SMD', component: 'MCU-STM32G071', qty: 1, description: 'ARM Cortex-M0+ 64MHz MCU', unit: 'EA', partType: 'Purchased' },
  { parent: 'ESC-40A-SMD', component: 'FET-DRIVER-3PH', qty: 1, description: 'Triple Half-Bridge Gate Driver', unit: 'EA', partType: 'Purchased' },
  { parent: 'ESC-40A-SMD', component: 'POWER-MOSFET-40V', qty: 6, description: '40V 100A N-Channel MOSFET DFN5x6', unit: 'EA', partType: 'Purchased' },
  { parent: 'ESC-40A-SMD', component: 'SHOCK-ABSORB-RING', qty: 4, description: 'Silicone Vibration Damper Ring', unit: 'EA', partType: 'Purchased' },

  // Level 2: CORE-FUSELAGE-MOD
  { parent: 'CORE-FUSELAGE-MOD', component: 'FLIGHT-CONTROLLER-H7', qty: 1, description: 'H743 Autopilot Board with Dual IMU', unit: 'EA', partType: 'Subassembly' },
  { parent: 'CORE-FUSELAGE-MOD', component: 'GPS-RTK-MODULE', qty: 1, description: 'High Precision RTK GNSS Receiver', unit: 'EA', partType: 'Purchased' },
  { parent: 'CORE-FUSELAGE-MOD', component: 'TELEMETRY-TRANSCEIVER-915', qty: 1, description: '915MHz 1000mW Long Range Radio', unit: 'EA', partType: 'Purchased' },
  { parent: 'CORE-FUSELAGE-MOD', component: 'GIMBAL-4K-PAYLOAD', qty: 1, description: '3-Axis Stabilized 4K EO/IR Camera', unit: 'EA', partType: 'Subassembly' },
  { parent: 'CORE-FUSELAGE-MOD', component: 'TOP-COVER-POLYCARB', qty: 1, description: 'Aero Molded Polycarbonate Canopy', unit: 'EA', partType: 'Purchased' },

  // Level 3: FLIGHT-CONTROLLER-H7 (Subassembly)
  { parent: 'FLIGHT-CONTROLLER-H7', component: 'MCU-STM32H743', qty: 1, description: '480MHz High-Performance Core MCU', unit: 'EA', partType: 'Purchased' },
  { parent: 'FLIGHT-CONTROLLER-H7', component: 'IMU-BMI088-DUAL', qty: 2, description: '6-Axis Ultra-Low Noise Gyro/Accel', unit: 'EA', partType: 'Purchased' },
  { parent: 'FLIGHT-CONTROLLER-H7', component: 'BARO-DPS310', qty: 1, description: 'Precision Digital Altimeter Sensor', unit: 'EA', partType: 'Purchased' },
  { parent: 'FLIGHT-CONTROLLER-H7', component: 'MAG-LIS3MDL', qty: 1, description: '3-Axis Digital Magnetometer / Compass', unit: 'EA', partType: 'Purchased' },
  { parent: 'FLIGHT-CONTROLLER-H7', component: 'FERRITE-BEAD-SMD', qty: 8, description: '0805 High-Frequency Noise Filter', unit: 'EA', partType: 'Purchased' },

  // Level 3: GIMBAL-4K-PAYLOAD (Subassembly)
  { parent: 'GIMBAL-4K-PAYLOAD', component: 'GIMBAL-GMB-MOTOR', qty: 3, description: 'Hollow Shaft Brushless Gimbal Motor', unit: 'EA', partType: 'Purchased' },
  { parent: 'GIMBAL-4K-PAYLOAD', component: 'ENCODER-MAG-AS5048', qty: 3, description: '14-Bit Magnetic Rotary Position Sensor', unit: 'EA', partType: 'Purchased' },
  { parent: 'GIMBAL-4K-PAYLOAD', component: 'CAMERA-4K-OPTICAL', qty: 1, description: 'Sony IMX Sensor 4K 60FPS Module', unit: 'EA', partType: 'Purchased' },
  { parent: 'GIMBAL-4K-PAYLOAD', component: 'FLEX-PCB-RIBBON', qty: 2, description: 'Ultra-Flexible FPC Ribbon Cable 30P', unit: 'EA', partType: 'Purchased' },

  // Level 2: LANDING-GEAR-PAIR
  { parent: 'LANDING-GEAR-PAIR', component: 'CARBON-ROD-8MM', qty: 2, description: 'Carbon Fiber Rod 8mm x 300mm', unit: 'EA', partType: 'Purchased' },
  { parent: 'LANDING-GEAR-PAIR', component: 'RUBBER-FOOT-PAD', qty: 2, description: 'High-Grip Anti-Vibration Rubber Pad', unit: 'EA', partType: 'Purchased' },
  { parent: 'LANDING-GEAR-PAIR', component: 'CLAMP-AL-8MM', qty: 4, description: 'CNC 8mm Anodized Clamp Bracket', unit: 'EA', partType: 'Purchased' },
];

export const SAMPLE_MULTI_LEVEL_BUILD_SCHEDULE: BuildScheduleRecord[] = [
  { parent: 'DRONE-X400', buildQty: 100, workOrder: 'WO-DRONE-01', dueDate: '2026-10-01', notes: 'Autonomous Fleet Q4 Build' },
];

export const SAMPLE_MULTI_LEVEL_INVENTORY: InventoryItem[] = [
  { partNumber: 'MOTOR-BLDC-2207', description: 'Brushless DC Motor 2207 1800KV', onHand: 350, safetyStock: 100, unitCost: 18.50, leadTimeDays: 25, unit: 'EA' },
  { partNumber: 'PROP-CARBON-10X45-CW', description: 'Carbon Propeller 10x4.5 CW', onHand: 180, safetyStock: 50, unitCost: 6.20, leadTimeDays: 14, unit: 'EA' },
  { partNumber: 'PROP-CARBON-10X45-CCW', description: 'Carbon Propeller 10x4.5 CCW', onHand: 190, safetyStock: 50, unitCost: 6.20, leadTimeDays: 14, unit: 'EA' },
  { partNumber: 'CARBON-TUBE-16MM', description: 'Carbon Fiber Tube 16mm x 250mm', onHand: 420, safetyStock: 80, unitCost: 4.10, leadTimeDays: 10, unit: 'EA' },
  { partNumber: 'M3-AL-SPACER', description: 'M3x20mm Knurled Aluminum Spacer', onHand: 1500, safetyStock: 400, unitCost: 0.35, leadTimeDays: 5, unit: 'EA' },
  { partNumber: 'BOLT-M3-12', description: 'M3x12mm Grade 12.9 Steel Bolt', onHand: 3000, safetyStock: 500, unitCost: 0.09, leadTimeDays: 3, unit: 'EA' },
  { partNumber: 'MCU-STM32G071', description: 'ARM Cortex-M0+ 64MHz MCU', onHand: 450, safetyStock: 100, unitCost: 2.80, leadTimeDays: 20, unit: 'EA' },
  { partNumber: 'FET-DRIVER-3PH', description: 'Triple Half-Bridge Gate Driver', onHand: 380, safetyStock: 100, unitCost: 1.95, leadTimeDays: 15, unit: 'EA' },
  { partNumber: 'POWER-MOSFET-40V', description: '40V 100A N-Channel MOSFET DFN5x6', onHand: 2200, safetyStock: 500, unitCost: 0.82, leadTimeDays: 18, unit: 'EA' },
  { partNumber: 'SHOCK-ABSORB-RING', description: 'Silicone Vibration Damper Ring', onHand: 1800, safetyStock: 300, unitCost: 0.15, leadTimeDays: 7, unit: 'EA' },
  { partNumber: 'BATT-PACK-6S-5000', description: 'LiPo 6S 5000mAh 45C Smart Battery', onHand: 60, safetyStock: 25, unitCost: 85.00, leadTimeDays: 35, unit: 'EA' },
  { partNumber: 'GPS-RTK-MODULE', description: 'High Precision RTK GNSS Receiver', onHand: 85, safetyStock: 30, unitCost: 48.00, leadTimeDays: 21, unit: 'EA' },
  { partNumber: 'TELEMETRY-TRANSCEIVER-915', description: '915MHz 1000mW Long Range Radio', onHand: 110, safetyStock: 40, unitCost: 32.00, leadTimeDays: 14, unit: 'EA' },
  { partNumber: 'TOP-COVER-POLYCARB', description: 'Aero Molded Polycarbonate Canopy', onHand: 120, safetyStock: 30, unitCost: 12.00, leadTimeDays: 12, unit: 'EA' },
  { partNumber: 'MCU-STM32H743', description: '480MHz High-Performance Core MCU', onHand: 70, safetyStock: 40, unitCost: 15.60, leadTimeDays: 45, unit: 'EA' },
  { partNumber: 'IMU-BMI088-DUAL', description: '6-Axis Ultra-Low Noise Gyro/Accel', onHand: 150, safetyStock: 60, unitCost: 7.40, leadTimeDays: 30, unit: 'EA' },
  { partNumber: 'BARO-DPS310', description: 'Precision Digital Altimeter Sensor', onHand: 95, safetyStock: 40, unitCost: 3.10, leadTimeDays: 14, unit: 'EA' },
  { partNumber: 'MAG-LIS3MDL', description: '3-Axis Digital Magnetometer / Compass', onHand: 80, safetyStock: 30, unitCost: 2.90, leadTimeDays: 14, unit: 'EA' },
  { partNumber: 'FERRITE-BEAD-SMD', description: '0805 High-Frequency Noise Filter', onHand: 2000, safetyStock: 400, unitCost: 0.05, leadTimeDays: 5, unit: 'EA' },
  { partNumber: 'GIMBAL-GMB-MOTOR', description: 'Hollow Shaft Brushless Gimbal Motor', onHand: 250, safetyStock: 80, unitCost: 14.20, leadTimeDays: 28, unit: 'EA' },
  { partNumber: 'ENCODER-MAG-AS5048', description: '14-Bit Magnetic Rotary Position Sensor', onHand: 280, safetyStock: 80, unitCost: 5.60, leadTimeDays: 21, unit: 'EA' },
  { partNumber: 'CAMERA-4K-OPTICAL', description: 'Sony IMX Sensor 4K 60FPS Module', onHand: 45, safetyStock: 20, unitCost: 65.00, leadTimeDays: 40, unit: 'EA' },
  { partNumber: 'FLEX-PCB-RIBBON', description: 'Ultra-Flexible FPC Ribbon Cable 30P', onHand: 180, safetyStock: 50, unitCost: 2.10, leadTimeDays: 10, unit: 'EA' },
  { partNumber: 'CARBON-ROD-8MM', description: 'Carbon Fiber Rod 8mm x 300mm', onHand: 350, safetyStock: 100, unitCost: 3.20, leadTimeDays: 10, unit: 'EA' },
  { partNumber: 'RUBBER-FOOT-PAD', description: 'High-Grip Anti-Vibration Rubber Pad', onHand: 400, safetyStock: 100, unitCost: 0.60, leadTimeDays: 5, unit: 'EA' },
  { partNumber: 'CLAMP-AL-8MM', description: 'CNC 8mm Anodized Clamp Bracket', onHand: 750, safetyStock: 200, unitCost: 1.80, leadTimeDays: 15, unit: 'EA' },
];

export function generateHighVolumeDataset(): {
  bomSource: BOMRawRecord[];
  buildSchedule: BuildScheduleRecord[];
  inventory: InventoryItem[];
} {
  const bomSource: BOMRawRecord[] = [];
  const buildSchedule: BuildScheduleRecord[] = [];
  const inventory: InventoryItem[] = [];

  const subassemblies = ['MOTOR-CORE', 'PUMP-HEAD', 'VALVE-BODY', 'GEARBOX-ASSY', 'PCB-MAIN', 'DISPLAY-BEZEL', 'HARNESS-PWR', 'ENCLOSURE-CAST', 'SENSOR-ARRAY', 'FILTER-ASSY'];
  const components = ['RES-10K', 'CAP-100UF', 'SCREW-M4-10', 'WASHER-M4', 'O-RING-VITON', 'BEARING-6202', 'SPRING-SS', 'BRACKET-STL', 'DIODE-SCHOTTKY', 'TERMINAL-LUG', 'PIN-DOWEL', 'BUSHING-BRZ'];

  for (let topId = 1; topId <= 50; topId++) {
    const topParent = `MACHINE-GEN5-SYS${String(topId).padStart(3, '0')}`;
    buildSchedule.push({
      parent: topParent,
      buildQty: Math.floor(Math.random() * 20) + 5,
      workOrder: `WO-SCALE-${topId}`,
      dueDate: '2026-11-15',
    });

    for (let s = 0; s < 4; s++) {
      const sub = `${subassemblies[(topId + s) % subassemblies.length]}-${topId}`;
      const subQty = Math.floor(Math.random() * 3) + 1;

      for (let c = 0; c < 5; c++) {
        const comp = components[(s * 3 + c) % components.length];
        const compQty = Math.floor(Math.random() * 6) + 1;

        bomSource.push({
          level1: topParent,
          level2: sub,
          level2Qty: subQty,
          level3: comp,
          level3Qty: compQty,
          description: `Industrial Component ${comp} for ${sub}`,
          unit: 'EA',
          parent: topParent,
          component: comp,
          qty: subQty * compQty,
        });
      }
    }
  }

  // Populate inventory for all unique components
  const uniqueComps = new Set<string>();
  bomSource.forEach((b) => {
    if (b.level3) uniqueComps.add(b.level3);
    if (b.level2) uniqueComps.add(b.level2);
  });

  uniqueComps.forEach((comp) => {
    const onHand = Math.floor(Math.random() * 1500) + 100;
    const safetyStock = Math.floor(Math.random() * 300) + 50;
    inventory.push({
      partNumber: comp,
      description: `Automated Stock Item ${comp}`,
      onHand,
      safetyStock,
      unitCost: Math.round((Math.random() * 15 + 0.5) * 100) / 100,
      leadTimeDays: Math.floor(Math.random() * 20) + 3,
      unit: 'EA',
    });
  });

  return { bomSource, buildSchedule, inventory };
}
