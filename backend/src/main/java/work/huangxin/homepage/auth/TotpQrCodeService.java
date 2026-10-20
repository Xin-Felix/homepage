package work.huangxin.homepage.auth;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Component;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

/** 在后端本地生成二维码，不把 TOTP secret 发送给任何第三方服务。 */
@Component
public class TotpQrCodeService {

    public String dataUrl(String content) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 280, 280);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(MatrixToImageWriter.toBufferedImage(matrix), "PNG", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception e) {
            throw new IllegalStateException("TOTP 二维码生成失败", e);
        }
    }
}
