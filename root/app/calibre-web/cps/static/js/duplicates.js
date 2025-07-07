/* This file is part of the Calibre-Web-Automated (CWA) duplicate management system
 *    Copyright (C) 2024 CWA Contributors
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/* Duplicate book management functionality */

$(document).ready(function() {
    var selectedBooks = [];
    
    // Get CSRF token
    var csrfToken = $('input[name="csrf_token"]').val();
    console.log("CWA-Duplicates: CSRF token found:", csrfToken ? "Yes" : "No");
    
    function updateSelectionCount() {
        var count = selectedBooks.length;
        if (count === 0) {
            $('#selection_count').text('');
            $('#delete_selected').addClass('disabled').attr('aria-disabled', true);
        } else {
            $('#selection_count').text(count + ' book' + (count > 1 ? 's' : '') + ' selected');
            $('#delete_selected').removeClass('disabled').attr('aria-disabled', false);
        }
    }
    
    function updateBookItemVisuals() {
        $('.book-item').each(function() {
            var checkbox = $(this).find('.book-checkbox');
            if (checkbox.is(':checked')) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }
        });
    }
    
    // Handle individual checkbox changes  
    $(document).on('change', '.book-checkbox', function() {
        var bookId = $(this).val();
        console.log("CWA-Duplicates: Checkbox changed for book ID:", bookId, "Checked:", $(this).is(':checked'));
        
        if ($(this).is(':checked')) {
            if (selectedBooks.indexOf(bookId) === -1) {
                selectedBooks.push(bookId);
                console.log("CWA-Duplicates: Added book ID to selection:", bookId);
            }
        } else {
            var index = selectedBooks.indexOf(bookId);
            if (index > -1) {
                selectedBooks.splice(index, 1);
                console.log("CWA-Duplicates: Removed book ID from selection:", bookId);
            }
        }
        console.log("CWA-Duplicates: Current selectedBooks array:", selectedBooks);
        updateSelectionCount();
        updateBookItemVisuals();
    });
    
    // Select All button
    $('#select_all').click(function() {
        $('.book-checkbox').prop('checked', true);
        selectedBooks = [];
        $('.book-checkbox').each(function() {
            selectedBooks.push($(this).val());
        });
        updateSelectionCount();
        updateBookItemVisuals();
    });
    
    // Select None button
    $('#select_none').click(function() {
        $('.book-checkbox').prop('checked', false);
        selectedBooks = [];
        updateSelectionCount();
        updateBookItemVisuals();
    });
    
    // Delete Selected button
    $('#delete_selected').click(function(event) {
        if ($(this).hasClass('disabled')) {
            event.stopPropagation();
        } else {
            console.log("CWA-Duplicates: Opening delete confirmation dialog...");
            console.log("CWA-Duplicates: Selected books for display:", selectedBooks);
            console.log("CWA-Duplicates: Number of selected books:", selectedBooks.length);
            
            // DEBUG: Check if any books are actually selected
            if (selectedBooks.length === 0) {
                $('#error_modal_message').text("No books selected! Please select books to delete.");
                $('#error_modal').modal('show');
                return;
            }
            console.log("CWA-Duplicates: Current pathname:", window.location.pathname);
            console.log("CWA-Duplicates: Full URL:", window.location.href);
            
            var constructedUrl = window.location.pathname + "/../ajax/displayselectedbooks";
            console.log("CWA-Duplicates: Constructed URL:", constructedUrl);
            
            // Use absolute URL like working table.js
            var relativeUrl = "/ajax/displayselectedbooks";
            console.log("CWA-Duplicates: Using absolute URL:", relativeUrl);
            console.log("CWA-Duplicates: Current window.location.pathname:", window.location.pathname);
            console.log("CWA-Duplicates: Final resolved URL:", new URL(relativeUrl, window.location.href).href);
            
            $('#delete_selected_modal').modal('show');
            
            // Convert book IDs to integers (same as table.js)
            var bookIds = selectedBooks.map(function(id) { return parseInt(id, 10); });
            console.log("CWA-Duplicates: Original selectedBooks:", selectedBooks);
            console.log("CWA-Duplicates: Converted book IDs:", bookIds);
            console.log("CWA-Duplicates: Book IDs types:", bookIds.map(function(id) { return typeof id + ":" + id; }));
            console.log("CWA-Duplicates: Request payload:", JSON.stringify({"selections": bookIds}));
            console.log("CWA-Duplicates: Payload length:", JSON.stringify({"selections": bookIds}).length);
            
            // Show list of books to be deleted (no CSRF - match table.js exactly)
            var ajaxData = {"selections": bookIds};
            console.log("CWA-Duplicates: Final ajaxData (no CSRF):", ajaxData);
            
            $.ajax({
                method: "post",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                url: relativeUrl,
                data: JSON.stringify(ajaxData),
                beforeSend: function(xhr) {
                    // Add CSRF token as header (like table.js)
                    if (csrfToken) {
                        xhr.setRequestHeader('X-CSRFToken', csrfToken);
                        console.log("CWA-Duplicates: Added CSRF token to header");
                    }
                    console.log("CWA-Duplicates: About to send request...");
                    console.log("CWA-Duplicates: Request URL:", relativeUrl);
                    console.log("CWA-Duplicates: Request data:", JSON.stringify({"selections": bookIds}));
                },
                            success: function(response) {
                console.log("CWA-Duplicates: Display response:", response);
                $('#display-delete-selected-books').empty();
                $.each(response.books, function(i, item) {
                    $("<span>- " + item + "</span><p></p>").appendTo("#display-delete-selected-books");
                });
                console.log("CWA-Duplicates: Added " + response.books.length + " books to confirmation dialog");
            },
            error: function(xhr, status, error) {
                console.error("CWA-Duplicates: Display error:", {xhr: xhr, status: status, error: error});
                console.error("CWA-Duplicates: Display response text:", xhr.responseText);
                console.error("CWA-Duplicates: Response headers:", xhr.getAllResponseHeaders());
                console.error("CWA-Duplicates: Status code:", xhr.status);
                console.error("CWA-Duplicates: Ready state:", xhr.readyState);
                
                // Try to parse HTML error response
                if (xhr.responseText) {
                    console.error("CWA-Duplicates: Full HTML error response:", xhr.responseText);
                    // Extract title from HTML error page if possible
                    var titleMatch = xhr.responseText.match(/<title>(.*?)<\/title>/);
                    if (titleMatch) {
                        console.error("CWA-Duplicates: Error page title:", titleMatch[1]);
                    }
                }
                
                $('#error_modal_message').text("Error loading book list for confirmation. Status: " + xhr.status + ". Check browser console for details.");
                $('#error_modal').modal('show');
            }
            });
        }
    });
    
    // Confirm delete
    $('#delete_selected_confirm').click(function() {
        console.log("CWA-Duplicates: Starting delete confirmation...");
        console.log("CWA-Duplicates: Selected books (strings):", selectedBooks);
        
        var deleteUrl = "/ajax/deleteselectedbooks";
        console.log("CWA-Duplicates: Using absolute URL:", deleteUrl);
        
        // Convert book IDs to integers (same as table.js)
        var bookIds = selectedBooks.map(function(id) { return parseInt(id, 10); });
        console.log("CWA-Duplicates: Converted delete book IDs:", bookIds);
        
        var deleteData = {"selections": bookIds};
        
        $.ajax({
            method: "post",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            url: deleteUrl,
            data: JSON.stringify(deleteData),
            beforeSend: function(xhr) {
                // Add CSRF token as header (like table.js)
                if (csrfToken) {
                    xhr.setRequestHeader('X-CSRFToken', csrfToken);
                    console.log("CWA-Duplicates: Added CSRF token to delete request header");
                }
                console.log("CWA-Duplicates: About to send delete request...");
                console.log("CWA-Duplicates: Delete URL:", deleteUrl);
                console.log("CWA-Duplicates: Delete data:", JSON.stringify(deleteData));
            },
            success: function(response) {
                console.log("CWA-Duplicates: Delete response:", response);
                if (response.success) {
                    // Close the delete confirmation modal
                    $('#delete_selected_modal').modal('hide');
                    
                    // Show success modal
                    $('#success_modal_message').text("Selected duplicate books have been deleted successfully!");
                    $('#success_modal').modal('show');
                    
                    console.log("CWA-Duplicates: Success modal shown");
                } else {
                    console.error("CWA-Duplicates: Delete failed:", response);
                    // Close the delete confirmation modal
                    $('#delete_selected_modal').modal('hide');
                    
                    // Show error modal
                    $('#error_modal_message').text("Error: " + (response.error || "Unknown error occurred"));
                    $('#error_modal').modal('show');
                }
            },
            error: function(xhr, status, error) {
                console.error("CWA-Duplicates: AJAX error:", {xhr: xhr, status: status, error: error});
                console.error("CWA-Duplicates: Response text:", xhr.responseText);
                console.error("CWA-Duplicates: Status code:", xhr.status);
                console.error("CWA-Duplicates: Ready state:", xhr.readyState);
                
                // Close the delete confirmation modal
                $('#delete_selected_modal').modal('hide');
                
                // Show error modal
                $('#error_modal_message').text("An error occurred while deleting books. Check browser console for details.");
                $('#error_modal').modal('show');
            }
        });
    });
    
    // Success modal OK button handler
    $('#success_modal_ok').click(function() {
        console.log("CWA-Duplicates: Success modal OK clicked, reloading page...");
        // Reload the page to refresh the duplicate list
        window.location.reload();
    });
    
    // Initialize
    updateSelectionCount();
    updateBookItemVisuals();
    
    // DEBUG: Check if checkboxes are found
    console.log("CWA-Duplicates: Found", $('.book-checkbox').length, "checkboxes on page load");
    if ($('.book-checkbox').length === 0) {
        console.error("CWA-Duplicates: No checkboxes found! Check template HTML.");
    }
}); 