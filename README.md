# 360 VR photo viewer

360/180度のフォトビュアーです。ステレオ画像対応。WebVR対応です。

PCではマウスによって向きを変えて見られます。マウスのホイールでズームします。

スマフォではジャイロ機能で向きが変わります。横持ちにするとステレオ写真ではside by sideの表示になるのでスマフォゴーグルで立体視することができます。

OculusGo/OculusQuest等のWebVR対応環境では、右下のVRボタンによって全天球VRモードで見ることができます。OculusGoのコントローラのタッチパッドで向きを変えることもできます。

imgとjsの下のファイルとv360.htmlのファイルのみで動作します。他のライブラリ等の依存はありません。

現状、画像サイズは最大8000x4000までになります。

ビュアーの使い方は

v360.html?画像のパス&mode 

でリンクします。modeはフォーマットによって以下の値を指定します。

 - mode=0 : 360度Equirectangularフォーマット (THETA等で撮った写真)
 - mode=1 : 360度Equirectangularを上下に並べたステレオ写真
 - mode=2 : Side by side のVR180 ステレオ写真
 - mode=3 : 横長パノラマ写真。iPhoneに合わせ縦方向の画角を63度に設定
 - mode=5 : Domemaster形式。床を表示して半球ドームに投影

具体例はサンプル [index.html](https://wakufactory.github.io/vr360/) を見てください。

ページ内にビュアーを埋め込めるembed形式はこちらのサンプルを [v360_embed.html](https://wakufactory.github.io/vr360/v360_embed.html)


