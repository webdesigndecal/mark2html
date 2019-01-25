{.let assignment-title Homework 1}
{.let assignment-due September 13th}
{.let assignment-due-time 6:30 PM PST}
{.let assignment-intro}

**Required Tool: Text Editor and Google Chrome Web Inspector**

In this exercise, you will get a plenty of practice using CSS selectors to select and style any element on your web page.

{./let}

{.let body}
<!-- Body starts here -->

**Before you begin**, please sign up for the Piazza page for this class <!-- PIAZZA. UPDATE THIS EACH SEMESTER -->[here](#). Piazza is where you can ask and answer questions about this class and web design in general. It is also where a bunch of important annoucements about the class will be made!

## Assignment

For this assignment, we have already provided you all the code to start with, so you don't have to create any extra files. You can download the assignment file here:

<p class="text-center">
    <a class="btn" href="{.link*:zip starter}">Download Assignment Starter Files</a>
</p>

In the assignment folder, you can find style.css inside assets/css/ folder. You can only make changes to this file. You are not allowed to change anything in index.html (except for problem 0, in the head tag, and the design section responses). This assignment is to have you practice using CSS selectors to select any element on your website, without making any edits in your HTML. We will take off points for making changes to the HTML file.

### Part 1: Selectors

In part one of this assignment, you will select various shapes and apply some CSS styles to only those shapes that you have selected. We will give you all the CSS styles you need, all you need to do is to just select the right shapes. (Sounds easy, huh?) In fact, we are giving away all the good colors too so you don't have to stick to the ugly default red, blue, or green. Many shapes. Much colors. Such fun.

- **Problem 0:** Link the style.css file in the index.html

    This is how the index.html knows where to look to style the elements.
    
    <details><summary>Hint</summary>
    
    Check out this week's presentation!

    </details>

    This step is a must when adding CSS styling to your website! After completing this step, your page should look like this:

    !{.link assets/images/p0.png}

- **Problem 1:** Select all **squares** and make their background orange.

    <details><summary>Hint</summary>

    To change the background color, use

    ```
    background: #e67e22;
    ```

    </details>

    After completing this step, your page should look like this:

    !{.link assets/images/p1.png}

- **Problem 2:** Select all **circles in the third row** and make them red.

    <details><summary>Hint</summary>

    To change the background color, use
    
    ```
    background: #de6868;
    ```

    </details>

    After completing this step, your page should look like this:

    !{.link assets/images/p2.png}

- **Problem 3:** Select all **fancy circles** and make their borders dotted

    <details><summary>Hint</summary>

    To change the border to dotted, use 
    
    ```
    border-style: dotted;
    ```

    </details>

    After completing this step, your page should look like this:

    !{.link assets/images/p3.png}

- **Problem 4:** Select all **circles in the first column** and make them disappear

    ***Note:*** We didn't cover this in lecture, but take a look at this website for help!

    <details><summary>Hint</summary>

    To make them disappear, use 
    
    ```
    opacity: 0;
    ```

    </details>

    After completing this step, your page should look like this:

    !{.link assets/images/p4.png}

- **Problem 5:** Select all **shapes that are either green or fancy** (can be both) and make them blue

    <details><summary>Hint</summary>

    To change the background, use 
    
    ```
    background: #6392c0;
    ```

    </details>

    After completing this step, your page should look like this:

    !{.link assets/images/p5.png}

- **Problem 6:** Select all **circles** and make them go faint **when you hover** over them

    <details><summary>Hint</summary>

    To make them go faint, use 
    
    ```
    opacity: 0.5;
    ```

    </details>

    It's okay if you see the circles that you made hidden in problem 4 reappear again when you hover over them.

    After completing this step, your page should look like this (the circle in the third column, second row is on hover.):

    !{.link assets/images/p6.png}

- **Problem 7:** Select all **circles in the second row** and make them bigger **when you hover** over them.

    <details><summary>Hint</summary>

    To make them bigger, use 
    
    ```
    transform: scale(1.25);
    ```

    </details>

    After completing this step, your page should look like this (the circle in the third column, second row is on hover.):

    !{.link assets/images/p7.png}

### Part 2: Reading Responses

In this part of the assignment, you will be reading an article related to web design principles and responding to a few questions. The purpose of this section is to prompt design thinking and awareness &mdash; we are a design course, after all. Instructions can be found in the `design_responses.html` file (which is also linked at the bottom of index.html).

Within the `<p>` tags, replace `[INSERT YOUR RESPONSE HERE]` with your responses in `design_responses.html`.

<!-- Body ends here -->
{./let}

{.let submission}
<!-- Submission info starts here -->

We will check your code to see if you have made any changes to your index.html file. **If you made any modifications to the file outside of the head tag, points will be deducted.** Additionally, we will be checking your responses to the reading assignment.

Your assignment must be submitted as a **.zip** file. Submission will automatically fail if your submission does not contain the index.html or if is not a zip file.

This assignment is due by **{. assignment-due}** at {. assignment-due-time}.

<!-- Submission info ends here -->
{./let}

{.include template-assignment-v1.md}
