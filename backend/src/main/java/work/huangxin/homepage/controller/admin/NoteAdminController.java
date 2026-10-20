package work.huangxin.homepage.controller.admin;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.domain.Note;
import work.huangxin.homepage.service.NoteService;

@RestController
@RequestMapping("/api/admin/notes")
@RequiredArgsConstructor
public class NoteAdminController {

    private final NoteService noteService;

    @GetMapping
    public ApiResponse<List<Note>> list() {
        return ApiResponse.ok(noteService.listAdmin());
    }

    @PostMapping
    public ApiResponse<Note> create(@Valid @RequestBody Note body) {
        return ApiResponse.ok(noteService.create(body));
    }

    @PutMapping("/{id}")
    public ApiResponse<Note> update(@PathVariable("id") Long id, @Valid @RequestBody Note body) {
        return ApiResponse.ok(noteService.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long id) {
        noteService.delete(id);
        return ApiResponse.ok();
    }
}
