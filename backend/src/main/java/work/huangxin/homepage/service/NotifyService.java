package work.huangxin.homepage.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;
import work.huangxin.homepage.config.HomepageProperties;
import work.huangxin.homepage.domain.Message;

/**
 * 新留言邮件提醒（可选）。只有同时配置了 spring.mail.host 和 homepage.notification.email 才会发送。
 */
@Slf4j
@Service
public class NotifyService {

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String to;
    private final String from;

    public NotifyService(ObjectProvider<JavaMailSender> mailSender,
                         HomepageProperties properties,
                         @Value("${spring.mail.username:}") String mailUsername) {
        this.mailSender = mailSender;
        this.to = properties.notification().email();
        this.from = StringUtils.hasText(mailUsername) ? mailUsername : properties.notification().from();
    }

    @Async
    public void newMessage(Message message) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || !StringUtils.hasText(to)) {
            return;
        }
        SimpleMailMessage mail = new SimpleMailMessage();
        if (StringUtils.hasText(from)) {
            mail.setFrom(from);
        }
        mail.setTo(to);
        mail.setSubject("[主页留言] " + message.getName());
        mail.setText("称呼：" + message.getName() + "\n"
                + "联系方式：" + (StringUtils.hasText(message.getContact()) ? message.getContact() : "（未填写）") + "\n\n"
                + message.getContent() + "\n");
        try {
            sender.send(mail);
        } catch (Exception e) {
            log.warn("留言邮件提醒发送失败：{}", e.getMessage());
        }
    }
}
