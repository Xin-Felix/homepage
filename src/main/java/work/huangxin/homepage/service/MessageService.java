package work.huangxin.homepage.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.common.exception.NotFoundException;
import work.huangxin.homepage.domain.Message;
import work.huangxin.homepage.repository.MessageRepository;

@Service
@RequiredArgsConstructor
public class MessageService {

    private static final String NOT_FOUND = "留言不存在";

    private final MessageRepository messageRepository;
    private final NotifyService notifyService;

    @Transactional
    public void create(String name, String contact, String content, String ip) {
        Message message = new Message();
        message.setName(name.trim());
        message.setContact(StringUtils.hasText(contact) ? contact.trim() : null);
        message.setContent(content.trim());
        message.setIpHash(ClientIp.hash(ip));
        messageRepository.save(message);
        notifyService.newMessage(message);
    }

    @Transactional(readOnly = true)
    public PageResult<Message> list(int page, int size) {
        Page<Message> result = messageRepository.findAllByOrderByIdDesc(PageRequest.of(page, size));
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size, result.getTotalPages());
    }

    @Transactional
    public void markRead(Long id) {
        Message message = messageRepository.findById(id).orElseThrow(() -> new NotFoundException(NOT_FOUND));
        message.setRead(true);
    }

    @Transactional
    public void delete(Long id) {
        Message message = messageRepository.findById(id).orElseThrow(() -> new NotFoundException(NOT_FOUND));
        messageRepository.delete(message);
    }

    @Transactional(readOnly = true)
    public long count() {
        return messageRepository.count();
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        return messageRepository.countByReadFalse();
    }

    public record PageResult<T>(List<T> items, long total, int page, int size, int totalPages) {
    }
}
