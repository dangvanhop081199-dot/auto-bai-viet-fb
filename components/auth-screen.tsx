import React, { useState } from "react";
import { Image, View } from "react-native";
import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Body, Btn, Card, Field, Notice, Title, Txt, useAction } from "./bazan-ui";

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const { signIn, errors: inErrors } = useSignIn();
  const { signUp, errors: upErrors } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [register, setRegister] = useState(false);
  const [emailAddress, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verify, setVerify] = useState(false);
  const action = useAction();
  const finishSignIn = async () => {
    if (signIn.status === "complete") await signIn.finalize({ navigate: () => {} });
    else if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      if (signIn.supportedSecondFactors.some((factor) => factor.strategy === "email_code")) {
        await signIn.mfa.sendEmailCode(); setVerify(true);
      } else throw new Error("Tài khoản yêu cầu xác thực bổ sung. Vui lòng đăng nhập trên bản web để hoàn tất.");
    } else throw new Error("Đăng nhập chưa hoàn tất. Kiểm tra email và mật khẩu.");
  };
  const submit = async () => {
    if (register) {
      if (verify) {
        const result = await signUp.verifications.verifyEmailCode({ code });
        if (result.error) throw new Error("Mã xác minh không hợp lệ hoặc đã hết hạn.");
        if (signUp.status === "complete") await signUp.finalize({ navigate: () => {} });
        else throw new Error("Cần bổ sung thông tin tài khoản. Vui lòng hoàn tất trên bản web.");
      } else {
        const result = await signUp.password({ emailAddress, password });
        if (result.error) throw new Error("Chưa tạo được tài khoản. Kiểm tra email và dùng mật khẩu mạnh.");
        await signUp.verifications.sendEmailCode(); setVerify(true); setPassword("");
      }
    } else if (verify) {
      const result = await signIn.mfa.verifyEmailCode({ code });
      if (result.error) throw new Error("Mã xác minh không hợp lệ.");
      await finishSignIn();
    } else {
      const result = await signIn.password({ emailAddress, password });
      if (result.error) throw new Error("Email hoặc mật khẩu không đúng.");
      await finishSignIn();
      setPassword("");
    }
  };
  const google = async () => {
    const result = await startSSOFlow({ strategy: "oauth_google", redirectUrl: AuthSession.makeRedirectUri() });
    if (!result.createdSessionId || !result.setActive) throw new Error("Đăng nhập Google chưa hoàn tất. Hãy thử email hoặc tiếp tục trên bản web.");
    await result.setActive({ session: result.createdSessionId });
  };
  const error = register ? upErrors : inErrors;
  return <Body>
    <View style={{ alignItems: "flex-start", gap: 12 }}><Image source={require("../assets/images/icon.png")} style={{ width: 70, height: 70, borderRadius: 18 }} /><Title>BAZAN AUTO LEAD</Title><Txt muted>Trợ lý tìm khách xe ghép Tây Nguyên</Txt></View>
    <Card><Txt>Nhận bài hợp lệ. Hiểu đúng nhu cầu. Theo dõi từng khách hàng.</Txt><Txt muted>Không cào dữ liệu Facebook, không lưu mật khẩu Facebook và không tự gửi bình luận.</Txt></Card>
    <Card><Title>{verify ? "Xác minh email" : register ? "Tạo tài khoản" : "Đăng nhập"}</Title>
      {verify ? <><Txt>Nhập mã đã gửi đến email của bạn.</Txt><Field label="Mã xác minh" value={code} onChange={setCode} numeric /></> :
        <><Field label="Email" value={emailAddress} onChange={setEmail} /><Field label="Mật khẩu ứng dụng" value={password} onChange={setPassword} secure /></>}
      {action.feedback}
      {error?.fields?.password && <Notice text="Mật khẩu chưa đáp ứng yêu cầu bảo mật." error />}
      <Btn title={verify ? "Xác minh" : register ? "Tạo tài khoản" : "Đăng nhập"} disabled={action.busy || (verify ? !code : !emailAddress || !password)} onPress={() => { void action.run(submit, verify ? "Đã xác minh." : "Kiểm tra email nếu được yêu cầu."); }} />
      {verify && <Btn title="Gửi lại mã" secondary disabled={action.busy} onPress={() => { void action.run(async () => { if (register) await signUp.verifications.sendEmailCode(); else await signIn.mfa.sendEmailCode(); }, "Đã gửi lại mã."); }} />}
      {!verify && <Btn title="Tiếp tục với Google" secondary disabled={action.busy} onPress={() => { void action.run(google, "Đã đăng nhập."); }} />}
      <Btn title={verify ? "Quay lại" : register ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"} secondary disabled={action.busy}
        onPress={() => { if (verify) { setVerify(false); void signIn.reset(); } else setRegister(!register); setCode(""); setPassword(""); }} />
      <View nativeID="clerk-captcha" />
    </Card>
    <Txt muted>Gia Lai · Kon Tum · Măng Đen · Ngọc Hồi · Sân bay Pleiku</Txt>
  </Body>;
}
